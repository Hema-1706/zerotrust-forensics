import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { verifyAuditLedgerChain } from '@/lib/audit';

export async function GET() {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const caseCountRes = await db.execute('SELECT COUNT(*) as count FROM cases');
  const activeCaseCountRes = await db.execute("SELECT COUNT(*) as count FROM cases WHERE status IN ('OPEN', 'ACTIVE', 'IN_PROGRESS')");
  const evidenceCountRes = await db.execute('SELECT COUNT(*) as count FROM evidence');
  const tamperedCountRes = await db.execute("SELECT COUNT(*) as count FROM evidence WHERE integrity_status = 'TAMPERED'");
  const pendingTransferCountRes = await db.execute("SELECT COUNT(*) as count FROM custody_transfers WHERE status = 'PENDING_RECEIVER_SIGNATURE'");
  const activeAlertCountRes = await db.execute("SELECT COUNT(*) as count FROM security_alerts WHERE status = 'ACTIVE'");
  const auditBlockCountRes = await db.execute('SELECT COUNT(*) as count FROM audit_ledger');

  const ledgerVerification = await verifyAuditLedgerChain();

  const recentAlertsRes = await db.execute('SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT 5');
  const recentEventsRes = await db.execute('SELECT * FROM audit_ledger ORDER BY sequence_number DESC LIMIT 5');

  return NextResponse.json({
    stats: {
      totalCases: Number(caseCountRes.rows[0]?.count || 0),
      activeCases: Number(activeCaseCountRes.rows[0]?.count || 0),
      totalEvidence: Number(evidenceCountRes.rows[0]?.count || 0),
      tamperedEvidence: Number(tamperedCountRes.rows[0]?.count || 0),
      pendingTransfers: Number(pendingTransferCountRes.rows[0]?.count || 0),
      activeAlerts: Number(activeAlertCountRes.rows[0]?.count || 0),
      auditBlocks: Number(auditBlockCountRes.rows[0]?.count || 0),
      ledgerChainIntact: ledgerVerification.valid,
    },
    recentAlerts: recentAlertsRes.rows,
    recentEvents: recentEventsRes.rows,
  });
}
