import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { verifyAuditLedgerChain } from '@/lib/audit';

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const actorRole = searchParams.get('role');
  const search = searchParams.get('search');

  let query = 'SELECT * FROM audit_ledger WHERE 1=1';
  const params: any[] = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (actorRole) {
    query += ' AND actor_role = ?';
    params.push(actorRole);
  }
  if (search) {
    query += ' AND (actor_name LIKE ? OR action LIKE ? OR resource_id LIKE ? OR details_json LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY sequence_number DESC';

  const res = await db.execute({ sql: query, args: params });
  return NextResponse.json({ events: res.rows });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();
  const result = await verifyAuditLedgerChain();

  if (!result.valid) {
    const alertId = 'ALT-' + Date.now();
    await db.execute({
      sql: `INSERT INTO security_alerts (id, category, severity, title, description, resource_type, resource_id, status, created_at)
            VALUES (?, 'AUDIT_CHAIN_CORRUPTION', 'CRITICAL', 'AUDIT LEDGER HASH CHAIN BROKEN', ?, 'AUDIT_LEDGER', ?, 'ACTIVE', ?)`,
      args: [
        alertId,
        `Audit ledger hash chain verification failed at sequence #${result.brokenSequence}. Reason: ${result.errorReason}`,
        `AUD-${result.brokenSequence}`,
        new Date().toISOString(),
      ],
    });
  }

  return NextResponse.json({
    verification: result,
  });
}
