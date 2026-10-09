import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { appendAuditEvent } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();
  const caseId = params.id;
  const caseRes = await db.execute({ sql: 'SELECT * FROM cases WHERE id = ?', args: [caseId] });
  const caseItem = caseRes.rows[0];

  if (!caseItem) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
  }

  const evidenceRes = await db.execute({
    sql: 'SELECT * FROM evidence WHERE case_id = ? ORDER BY created_at DESC',
    args: [caseId],
  });

  return NextResponse.json({
    case: caseItem,
    evidence: evidenceRes.rows,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(['Admin', 'Investigator']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const caseId = params.id;
    const body = await request.json();
    const { title, description, status, priority, classification } = body;

    const existingCaseRes = await db.execute({ sql: 'SELECT * FROM cases WHERE id = ?', args: [caseId] });
    const existingCase = existingCaseRes.rows[0] as any;

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedCase = {
      title: title || existingCase.title,
      description: description || existingCase.description,
      status: status || existingCase.status,
      priority: priority || existingCase.priority,
      classification: classification || existingCase.classification,
      updated_at: now,
      id: caseId,
    };

    await db.execute({
      sql: `UPDATE cases
            SET title = ?, description = ?, status = ?, priority = ?, classification = ?, updated_at = ?
            WHERE id = ?`,
      args: [updatedCase.title, updatedCase.description, updatedCase.status, updatedCase.priority, updatedCase.classification, updatedCase.updated_at, caseId],
    });

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'CASE_UPDATE',
      'CASE',
      caseId,
      { changes: body }
    );

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update case' }, { status: 500 });
  }
}
