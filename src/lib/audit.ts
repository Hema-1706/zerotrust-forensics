import { db, initDatabase } from './db';
import { computeSHA256 } from './crypto';

export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

export interface AuditEventRow {
  id: string;
  sequence_number: number;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details_json: string;
  previous_hash: string;
  current_hash: string;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Append an entry to the hash-linked audit ledger
 */
export async function appendAuditEvent(
  actor: AuditActor,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any>
): Promise<AuditEventRow> {
  await initDatabase();
  const now = new Date().toISOString();

  // Get latest event
  const lastEventRes = await db.execute('SELECT * FROM audit_ledger ORDER BY sequence_number DESC LIMIT 1');
  const lastEvent = lastEventRes.rows[0] as unknown as AuditEventRow | undefined;

  const seq = lastEvent ? Number(lastEvent.sequence_number) + 1 : 1;
  const prevHash = lastEvent ? String(lastEvent.current_hash) : GENESIS_HASH;
  const eventId = 'AUD-' + String(seq).padStart(6, '0');
  const detailsJson = JSON.stringify(details);

  const payload = `${seq}|${now}|${actor.id}|${action}|${resourceType}|${resourceId}|${detailsJson}|${prevHash}`;
  const currentHash = computeSHA256(payload);

  const record: AuditEventRow = {
    id: eventId,
    sequence_number: seq,
    timestamp: now,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details_json: detailsJson,
    previous_hash: prevHash,
    current_hash: currentHash,
  };

  await db.execute({
    sql: `INSERT INTO audit_ledger (id, sequence_number, timestamp, actor_id, actor_name, actor_role, action, resource_type, resource_id, details_json, previous_hash, current_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.id,
      record.sequence_number,
      record.timestamp,
      record.actor_id,
      record.actor_name,
      record.actor_role,
      record.action,
      record.resource_type,
      record.resource_id,
      record.details_json,
      record.previous_hash,
      record.current_hash,
    ],
  });

  return record;
}

/**
 * Verify cryptographic hash-chain integrity across all audit events
 */
export async function verifyAuditLedgerChain(): Promise<{
  valid: boolean;
  totalBlocks: number;
  brokenSequence?: number;
  errorReason?: string;
  checkedAt: string;
}> {
  await initDatabase();
  const res = await db.execute('SELECT * FROM audit_ledger ORDER BY sequence_number ASC');
  const events = res.rows as unknown as AuditEventRow[];
  const checkedAt = new Date().toISOString();

  if (events.length === 0) {
    return { valid: true, totalBlocks: 0, checkedAt };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    const seqNum = Number(evt.sequence_number);
    const prevHash = String(evt.previous_hash);
    const currHash = String(evt.current_hash);

    // Check 1: Previous hash link check
    if (prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalBlocks: events.length,
        brokenSequence: seqNum,
        errorReason: `Previous hash mismatch at sequence #${seqNum}. Expected: ${expectedPrevHash.substring(0, 16)}..., Found: ${prevHash.substring(0, 16)}...`,
        checkedAt,
      };
    }

    // Check 2: Recalculate current hash check
    const payload = `${seqNum}|${evt.timestamp}|${evt.actor_id}|${evt.action}|${evt.resource_type}|${evt.resource_id}|${evt.details_json}|${prevHash}`;
    const recomputedHash = computeSHA256(payload);

    if (currHash !== recomputedHash) {
      return {
        valid: false,
        totalBlocks: events.length,
        brokenSequence: seqNum,
        errorReason: `Event payload tampered at sequence #${seqNum}. Recalculated hash does not match recorded block hash.`,
        checkedAt,
      };
    }

    expectedPrevHash = currHash;
  }

  return {
    valid: true,
    totalBlocks: events.length,
    checkedAt,
  };
}
