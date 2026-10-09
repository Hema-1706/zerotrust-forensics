import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { signEd25519, verifyEd25519 } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const transferId = params.id;
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    const transferRes = await db.execute({ sql: 'SELECT * FROM custody_transfers WHERE id = ?', args: [transferId] });
    const transfer = transferRes.rows[0] as any;
    if (!transfer) {
      return NextResponse.json({ error: 'Custody transfer record not found.' }, { status: 404 });
    }

    if (String(transfer.status) !== 'PENDING_RECEIVER_SIGNATURE') {
      return NextResponse.json({ error: `Transfer is not in pending signature state (Current: ${transfer.status}).` }, { status: 400 });
    }

    if (String(transfer.receiver_id) !== authResult.user.id && authResult.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Only the intended receiver can sign and accept this custody transfer.' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (action === 'reject') {
      await db.execute({ sql: "UPDATE custody_transfers SET status = 'REJECTED' WHERE id = ?", args: [transferId] });
      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'CUSTODY_TRANSFER_REJECTED',
        'CUSTODY_TRANSFER',
        transferId,
        { reason: 'Receiver rejected transfer' }
      );
      return NextResponse.json({ success: true, message: 'Custody transfer request rejected.' });
    }

    const receiverRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [authResult.user.id] });
    const senderRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [String(transfer.sender_id)] });

    const receiverUser = receiverRes.rows[0] as any;
    const senderUser = senderRes.rows[0] as any;

    if (!receiverUser || !senderUser) {
      return NextResponse.json({ error: 'Sender or Receiver account missing key parameters.' }, { status: 500 });
    }

    const receiverSignature = signEd25519(String(transfer.payload_to_sign), String(receiverUser.ed25519_private_key));

    const isSenderSignatureValid = verifyEd25519(
      String(transfer.payload_to_sign),
      String(transfer.sender_signature),
      String(senderUser.ed25519_public_key)
    );

    const isReceiverSignatureValid = verifyEd25519(
      String(transfer.payload_to_sign),
      receiverSignature,
      String(receiverUser.ed25519_public_key)
    );

    if (isSenderSignatureValid && isReceiverSignatureValid) {
      await db.execute({
        sql: `UPDATE custody_transfers
              SET receiver_signature = ?, receiver_signed_at = ?, status = 'COMPLETED'
              WHERE id = ?`,
        args: [receiverSignature, now, transferId],
      });

      await db.execute({
        sql: `UPDATE evidence
              SET current_custodian_id = ?, current_custodian_name = ?
              WHERE id = ?`,
        args: [String(receiverUser.id), String(receiverUser.name), String(transfer.evidence_id)],
      });

      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'CUSTODY_TRANSFER_COMPLETED',
        'CUSTODY_TRANSFER',
        transferId,
        {
          evidence_id: transfer.evidence_id,
          sender_id: senderUser.id,
          receiver_id: receiverUser.id,
          sender_signature_verified: true,
          receiver_signature_verified: true,
        }
      );

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        message: 'Dual-party Ed25519 cryptographic signatures successfully verified! Evidence custody updated to ' + receiverUser.name,
      });
    } else {
      await db.execute({ sql: "UPDATE custody_transfers SET status = 'REJECTED_SIGNATURE_INVALID' WHERE id = ?", args: [transferId] });

      const alertId = 'ALT-' + Date.now();
      await db.execute({
        sql: `INSERT INTO security_alerts (id, category, severity, title, description, resource_type, resource_id, status, created_at)
              VALUES (?, 'INVALID_CUSTODY_SIGNATURE', 'HIGH', 'INVALID CUSTODY TRANSFER SIGNATURE DETECTED', ?, 'CUSTODY_TRANSFER', ?, 'ACTIVE', ?)`,
        args: [
          alertId,
          `Ed25519 digital signature validation failed for custody transfer ${transferId}. Sender Signature Valid: ${isSenderSignatureValid}, Receiver Signature Valid: ${isReceiverSignatureValid}. Transfer rejected.`,
          transferId,
          now,
        ],
      });

      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'CUSTODY_TRANSFER_SIGNATURE_FAILED',
        'CUSTODY_TRANSFER',
        transferId,
        {
          sender_signature_valid: isSenderSignatureValid,
          receiver_signature_valid: isReceiverSignatureValid,
          alert_generated: alertId,
        }
      );

      return NextResponse.json({
        success: false,
        error: 'Cryptographic signature verification failed! Transfer rejected and high-severity security alert raised.',
        senderSignatureValid: isSenderSignatureValid,
        receiverSignatureValid: isReceiverSignatureValid,
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Signing failed' }, { status: 500 });
  }
}
