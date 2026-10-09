import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { computeSHA256 } from '@/lib/crypto';

export async function POST(request: Request) {
  const authResult = await requireAuth(['Admin', 'Auditor']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const { action, sequence_number } = await request.json();

    if (action === 'tamper') {
      const targetSeq = sequence_number || 2;
      const targetRes = await db.execute({ sql: 'SELECT * FROM audit_ledger WHERE sequence_number = ?', args: [targetSeq] });
      const targetRow = targetRes.rows[0] as any;

      if (!targetRow) {
        return NextResponse.json({ error: `Audit row at sequence #${targetSeq} not found.` }, { status: 404 });
      }

      const tamperedDetails = JSON.stringify({
        ...JSON.parse(String(targetRow.details_json || '{}')),
        UNAUTHORIZED_DB_ALTERATION: 'FORGED_BY_MALICIOUS_DBA_AT_' + new Date().toISOString(),
      });

      await db.execute({ sql: 'UPDATE audit_ledger SET details_json = ? WHERE sequence_number = ?', args: [tamperedDetails, targetSeq] });

      return NextResponse.json({
        success: true,
        message: `Simulated DB tampering applied to Audit Event #${targetSeq}! The payload text was modified directly in SQLite without updating the hash chain. Now click 'Verify Audit Chain' to test detection.`,
      });
    } else if (action === 'repair') {
      const rowsRes = await db.execute('SELECT * FROM audit_ledger ORDER BY sequence_number ASC');
      const rows = rowsRes.rows as any[];
      let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

      for (const row of rows) {
        const payload = `${row.sequence_number}|${row.timestamp}|${row.actor_id}|${row.action}|${row.resource_type}|${row.resource_id}|${row.details_json}|${prevHash}`;
        const newCurrentHash = computeSHA256(payload);

        await db.execute({
          sql: `UPDATE audit_ledger
                SET previous_hash = ?, current_hash = ?
                WHERE sequence_number = ?`,
          args: [prevHash, newCurrentHash, row.sequence_number],
        });

        prevHash = newCurrentHash;
      }

      return NextResponse.json({
        success: true,
        message: 'Audit ledger hash chain recalculated and repaired from genesis block to current head.',
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'tamper' or 'repair'." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Audit tamper simulation failed' }, { status: 500 });
  }
}
