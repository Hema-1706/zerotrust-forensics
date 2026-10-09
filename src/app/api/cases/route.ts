import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { appendAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search');

  let query = 'SELECT * FROM cases WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR id LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY created_at DESC';

  const res = await db.execute({ sql: query, args: params });
  return NextResponse.json({ cases: res.rows });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(['Admin', 'Investigator']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const body = await request.json();
    const { title, description, priority, classification } = body;

    if (!title || !description || !priority || !classification) {
      return NextResponse.json({ error: 'Missing required fields (title, description, priority, classification).' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const countRes = await db.execute('SELECT COUNT(*) as count FROM cases');
    const count = Number(countRes.rows[0]?.count || 0);
    const caseId = `CASE-2026-${String(count + 1).padStart(3, '0')}`;

    const newCase = {
      id: caseId,
      title,
      description,
      status: 'OPEN',
      priority,
      classification,
      lead_investigator_id: authResult.user.id,
      lead_investigator_name: authResult.user.name,
      created_at: now,
      updated_at: now,
    };

    await db.execute({
      sql: `INSERT INTO cases (id, title, description, status, priority, classification, lead_investigator_id, lead_investigator_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newCase.id, newCase.title, newCase.description, newCase.status, newCase.priority, newCase.classification, newCase.lead_investigator_id, newCase.lead_investigator_name, newCase.created_at, newCase.updated_at],
    });

    // Audit log
    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'CASE_CREATION',
      'CASE',
      caseId,
      { title, priority, classification }
    );

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create case' }, { status: 500 });
  }
}
