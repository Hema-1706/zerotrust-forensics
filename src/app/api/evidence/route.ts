import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { computeSHA256, encryptMetadataAES256GCM } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('case_id');
  const category = searchParams.get('category');
  const integrityStatus = searchParams.get('integrity_status');

  let query = 'SELECT * FROM evidence WHERE 1=1';
  const params: any[] = [];

  if (caseId) {
    query += ' AND case_id = ?';
    params.push(caseId);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (integrityStatus) {
    query += ' AND integrity_status = ?';
    params.push(integrityStatus);
  }

  query += ' ORDER BY created_at DESC';

  const res = await db.execute({ sql: query, args: params });
  return NextResponse.json({ evidence: res.rows });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(['Admin', 'Investigator', 'Lab Analyst']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caseId = formData.get('case_id') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string || 'General Artifact';
    const location = formData.get('location') as string || 'Secure Evidence Locker';
    const sensitiveNotes = formData.get('sensitive_notes') as string || '';

    if (!file || !caseId || !name) {
      return NextResponse.json({ error: 'File, Case ID, and Evidence Name are required.' }, { status: 400 });
    }

    const targetCaseRes = await db.execute({ sql: 'SELECT id FROM cases WHERE id = ?', args: [caseId] });
    if (targetCaseRes.rows.length === 0) {
      return NextResponse.json({ error: 'Target Case does not exist.' }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Genuine SHA-256 calculation
    const sha256Hash = computeSHA256(buffer);

    const evidenceCode = `EVD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const evidenceId = evidenceCode;

    const safeFilename = `${evidenceCode}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    fs.writeFileSync(filePath, buffer);

    let encryptedMetadataStr: string | null = null;
    if (sensitiveNotes.trim().length > 0) {
      const encryptedObj = encryptMetadataAES256GCM(JSON.stringify({
        notes: sensitiveNotes,
        registered_by: authResult.user.name,
        timestamp: new Date().toISOString(),
      }));
      encryptedMetadataStr = JSON.stringify(encryptedObj);
    }

    const now = new Date().toISOString();

    const record = {
      id: evidenceId,
      case_id: caseId,
      evidence_code: evidenceCode,
      name,
      category,
      file_name: safeFilename,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type || 'application/octet-stream',
      sha256_hash: sha256Hash,
      last_verified_hash: sha256Hash,
      last_verified_at: now,
      integrity_status: 'INTACT',
      current_custodian_id: authResult.user.id,
      current_custodian_name: authResult.user.name,
      acquired_date: now,
      location,
      encrypted_metadata: encryptedMetadataStr,
      created_by: authResult.user.id,
      created_at: now,
    };

    await db.execute({
      sql: `INSERT INTO evidence (id, case_id, evidence_code, name, category, file_name, file_path, file_size, mime_type, sha256_hash, last_verified_hash, last_verified_at, integrity_status, current_custodian_id, current_custodian_name, acquired_date, location, encrypted_metadata, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        record.id, record.case_id, record.evidence_code, record.name, record.category, record.file_name, record.file_path, record.file_size, record.mime_type, record.sha256_hash, record.last_verified_hash, record.last_verified_at, record.integrity_status, record.current_custodian_id, record.current_custodian_name, record.acquired_date, record.location, record.encrypted_metadata, record.created_by, record.created_at,
      ],
    });

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'EVIDENCE_REGISTRATION',
      'EVIDENCE',
      evidenceId,
      {
        case_id: caseId,
        evidence_code: evidenceCode,
        file_name: safeFilename,
        file_size: buffer.length,
        sha256: sha256Hash,
        encrypted_metadata: !!encryptedMetadataStr,
      }
    );

    return NextResponse.json({ success: true, evidence: record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Evidence upload failed' }, { status: 500 });
  }
}
