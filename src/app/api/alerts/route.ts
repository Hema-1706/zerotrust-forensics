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
  const category = searchParams.get('category');
  const severity = searchParams.get('severity');

  let query = 'SELECT * FROM security_alerts WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }

  query += ' ORDER BY created_at DESC';

  const res = await db.execute({ sql: query, args: params });
  return NextResponse.json({ alerts: res.rows });
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth(['Admin', 'Auditor']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const { alert_id, resolution_notes, status } = await request.json();

    if (!alert_id) {
      return NextResponse.json({ error: 'Alert ID is required.' }, { status: 400 });
    }

    const alertRes = await db.execute({ sql: 'SELECT * FROM security_alerts WHERE id = ?', args: [alert_id] });
    const alertItem = alertRes.rows[0] as any;
    if (!alertItem) {
      return NextResponse.json({ error: 'Security alert not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newStatus = status || 'RESOLVED';

    await db.execute({
      sql: `UPDATE security_alerts
            SET status = ?, resolved_by = ?, resolved_at = ?, resolution_notes = ?
            WHERE id = ?`,
      args: [newStatus, authResult.user.name, now, resolution_notes || 'Resolved by ' + authResult.user.name, alert_id],
    });

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'SECURITY_ALERT_RESOLVED',
      'SECURITY_ALERT',
      alert_id,
      { resolution_notes, new_status: newStatus }
    );

    return NextResponse.json({ success: true, message: 'Security alert status updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update alert' }, { status: 500 });
  }
}
