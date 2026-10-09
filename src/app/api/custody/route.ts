import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { signEd25519 } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const { searchParams } = new URL(request.url);
  const evidenceId = searchParams.get('evidence_id');
  const status = searchParams.get('status');

  let query = `
    SELECT ct.*, e.name as evidence_name, e.evidence_code
    FROM custody_transfers ct
    JOIN evidence e ON ct.evidence_id = e.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (evidenceId) {
    query += ' AND ct.evidence_id = ?';
    params.push(evidenceId);
  }
  if (status) {
    query += ' AND ct.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ct.created_at DESC';

  const res = await db.execute({ sql: query, args: params });
  return NextResponse.json({ transfers: res.rows });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(['Admin', 'Investigator', 'Lab Analyst']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const body = await request.json();
    const { evidence_id, receiver_id, reason, transfer_notes } = body;

    if (!evidence_id || !receiver_id || !reason) {
      return NextResponse.json({ error: 'Evidence ID, Receiver ID, and Reason are required.' }, { status: 400 });
    }

    const evidenceRes = await db.execute({ sql: 'SELECT * FROM evidence WHERE id = ?', args: [evidence_id] });
    const evidenceItem = evidenceRes.rows[0] as any;
    if (!evidenceItem) {
      return NextResponse.json({ error: 'Evidence item not found.' }, { status: 404 });
    }

    if (String(evidenceItem.current_custodian_id) !== authResult.user.id && !['Admin', 'Investigator'].includes(authResult.user.role)) {
      return NextResponse.json({ error: 'Only the current custodian or lead investigator can initiate a transfer.' }, { status: 403 });
    }

    const receiverRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [receiver_id] });
    const receiverUser = receiverRes.rows[0] as any;
    if (!receiverUser) {
      return NextResponse.json({ error: 'Intended receiver user not found.' }, { status: 404 });
    }

    const senderRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [authResult.user.id] });
    const senderUser = senderRes.rows[0] as any;

    const now = new Date().toISOString();
    const transferId = 'TRF-' + String(Date.now()).slice(-8);

    const payloadToSign = `${evidence_id}|${senderUser.id}|${receiverUser.id}|${now}|${reason}`;
    const senderSignature = signEd25519(payloadToSign, String(senderUser.ed25519_private_key));

    const record = {
      id: transferId,
      evidence_id,
      sender_id: String(senderUser.id),
      sender_name: String(senderUser.name),
      receiver_id: String(receiverUser.id),
      receiver_name: String(receiverUser.name),
      reason,
      transfer_notes: transfer_notes || '',
      status: 'PENDING_RECEIVER_SIGNATURE',
      payload_to_sign: payloadToSign,
      sender_signature: senderSignature,
      sender_signed_at: now,
      receiver_signature: null,
      receiver_signed_at: null,
      created_at: now,
    };

    await db.execute({
      sql: `INSERT INTO custody_transfers (id, evidence_id, sender_id, sender_name, receiver_id, receiver_name, reason, transfer_notes, status, payload_to_sign, sender_signature, sender_signed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        record.id, record.evidence_id, record.sender_id, record.sender_name, record.receiver_id, record.receiver_name, record.reason, record.transfer_notes, record.status, record.payload_to_sign, record.sender_signature, record.sender_signed_at, record.created_at,
      ],
    });

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'CUSTODY_TRANSFER_REQUESTED',
      'CUSTODY_TRANSFER',
      transferId,
      {
        evidence_id,
        receiver_id: receiverUser.id,
        receiver_name: receiverUser.name,
        sender_ed25519_signature: senderSignature.substring(0, 16) + '...',
      }
    );

    return NextResponse.json({ success: true, transfer: record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to initiate custody transfer' }, { status: 500 });
  }
}
