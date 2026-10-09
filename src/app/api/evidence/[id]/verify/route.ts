import { NextResponse } from 'next/server';
import fs from 'fs';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { computeSHA256 } from '@/lib/crypto';
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
    const evidenceId = params.id;
    const itemRes = await db.execute({ sql: 'SELECT * FROM evidence WHERE id = ?', args: [evidenceId] });
    const item = itemRes.rows[0] as any;

    if (!item) {
      return NextResponse.json({ error: 'Evidence item not found.' }, { status: 404 });
    }

    if (!fs.existsSync(String(item.file_path))) {
      return NextResponse.json({ error: `Evidence file not found on disk at path ${item.file_path}` }, { status: 500 });
    }

    const fileBytes = fs.readFileSync(String(item.file_path));
    const currentHash = computeSHA256(fileBytes);
    const now = new Date().toISOString();

    const isMatch = currentHash === String(item.sha256_hash);
    const newStatus = isMatch ? 'INTACT' : 'TAMPERED';

    await db.execute({
      sql: `UPDATE evidence
            SET last_verified_hash = ?, last_verified_at = ?, integrity_status = ?
            WHERE id = ?`,
      args: [currentHash, now, newStatus, evidenceId],
    });

    if (!isMatch) {
      const alertId = 'ALT-' + Date.now();
      await db.execute({
        sql: `INSERT INTO security_alerts (id, category, severity, title, description, resource_type, resource_id, status, created_at)
              VALUES (?, 'FILE_TAMPERING_DETECTED', 'CRITICAL', ?, ?, 'EVIDENCE', ?, 'ACTIVE', ?)`,
        args: [
          alertId,
          `EVIDENCE FILE TAMPERED: ${item.name}`,
          `SHA-256 integrity check failed for evidence ${item.evidence_code} (${item.name}). Stored original hash: ${item.sha256_hash}. Current disk file hash: ${currentHash}. Immediate investigation required.`,
          evidenceId,
          now,
        ],
      });

      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'INTEGRITY_CHECK_FAILED',
        'EVIDENCE',
        evidenceId,
        {
          original_hash: item.sha256_hash,
          recalculated_hash: currentHash,
          status: 'TAMPERED',
          alert_generated: alertId,
        }
      );

      return NextResponse.json({
        success: true,
        match: false,
        status: 'TAMPERED',
        originalHash: item.sha256_hash,
        currentHash,
        message: 'CRITICAL SECURITY ALERT: Evidence file has been altered or tampered on disk!',
        alertId,
      });
    }

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'INTEGRITY_CHECK_PASSED',
      'EVIDENCE',
      evidenceId,
      {
        original_hash: item.sha256_hash,
        recalculated_hash: currentHash,
        status: 'INTACT',
      }
    );

    return NextResponse.json({
      success: true,
      match: true,
      status: 'INTACT',
      originalHash: item.sha256_hash,
      currentHash,
      message: 'Integrity verified successfully. File checksum matches original registration SHA-256 hash exactly.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Integrity check failed' }, { status: 500 });
  }
}
