import { NextResponse } from 'next/server';
import fs from 'fs';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { appendAuditEvent } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(['Admin', 'Investigator', 'Lab Analyst']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const evidenceId = params.id;
    const body = await request.json();
    const { action } = body;

    const itemRes = await db.execute({ sql: 'SELECT * FROM evidence WHERE id = ?', args: [evidenceId] });
    const item = itemRes.rows[0] as any;

    if (!item) {
      return NextResponse.json({ error: 'Evidence item not found.' }, { status: 404 });
    }

    const filePath = String(item.file_path);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File path does not exist on disk.' }, { status: 500 });
    }

    const backupPath = filePath + '.orig_bak';

    if (action === 'tamper') {
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      const buffer = fs.readFileSync(filePath);
      if (buffer.length > 0) {
        buffer[0] = buffer[0] ^ 0xff;
      }
      fs.writeFileSync(filePath, buffer);

      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'SIMULATED_FILE_TAMPERING',
        'EVIDENCE',
        evidenceId,
        { action: 'Altered 1 byte in physical file on disk for demo verification test' }
      );

      return NextResponse.json({
        success: true,
        message: `Simulated file tampering applied to ${item.evidence_code}. File bytes modified on disk! Now click 'Verify Integrity' to test SHA-256 mismatch alert detection.`,
      });
    } else if (action === 'restore') {
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
      }

      await db.execute({ sql: "UPDATE evidence SET integrity_status = 'INTACT' WHERE id = ?", args: [evidenceId] });

      await appendAuditEvent(
        { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
        'RESTORED_ORIGINAL_FILE',
        'EVIDENCE',
        evidenceId,
        { action: 'Restored original file bytes from backup' }
      );

      return NextResponse.json({
        success: true,
        message: `Original file bytes restored for ${item.evidence_code}. Click 'Verify Integrity' to verify hash matches again.`,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'tamper' or 'restore'." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tamper simulation failed' }, { status: 500 });
  }
}
