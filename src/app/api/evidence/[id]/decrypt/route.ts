import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { decryptMetadataAES256GCM } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(['Admin', 'Investigator']);
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

    if (!item.encrypted_metadata) {
      return NextResponse.json({ error: 'No encrypted metadata exists for this evidence item.' }, { status: 400 });
    }

    const { ciphertext, iv, authTag } = JSON.parse(String(item.encrypted_metadata));
    const decryptedText = decryptMetadataAES256GCM(ciphertext, iv, authTag);

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'SENSITIVE_METADATA_DECRYPTED',
      'EVIDENCE',
      evidenceId,
      { evidence_code: item.evidence_code, decrypted_by: authResult.user.name }
    );

    return NextResponse.json({
      success: true,
      decryptedMetadata: JSON.parse(decryptedText),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Decryption failed. Authentication tag mismatch or corrupted key.' }, { status: 500 });
  }
}
