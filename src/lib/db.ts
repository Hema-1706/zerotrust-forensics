import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { hashPassword, computeSHA256, generateEd25519Keypair, encryptMetadataAES256GCM } from './crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const dbPath = path.resolve(DATA_DIR, 'zerotrust_forensics.db');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;

export const db: Client = createClient({
  url: dbUrl,
});

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Investigator', 'Lab Analyst', 'Auditor')),
      ed25519_public_key TEXT NOT NULL,
      ed25519_private_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('OPEN', 'ACTIVE', 'IN_PROGRESS', 'UNDER_REVIEW', 'CLOSED', 'ARCHIVED')),
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      classification TEXT NOT NULL CHECK(classification IN ('UNCLASSIFIED', 'RESTRICTED', 'CONFIDENTIAL', 'SECRET')),
      lead_investigator_id TEXT NOT NULL,
      lead_investigator_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lead_investigator_id) REFERENCES users(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      evidence_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      last_verified_hash TEXT,
      last_verified_at TEXT,
      integrity_status TEXT NOT NULL DEFAULT 'INTACT',
      current_custodian_id TEXT NOT NULL,
      current_custodian_name TEXT NOT NULL,
      acquired_date TEXT NOT NULL,
      location TEXT NOT NULL,
      encrypted_metadata TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (current_custodian_id) REFERENCES users(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS custody_transfers (
      id TEXT PRIMARY KEY,
      evidence_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      transfer_notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING_SIGNATURES',
      payload_to_sign TEXT NOT NULL,
      sender_signature TEXT,
      sender_signed_at TEXT,
      receiver_signature TEXT,
      receiver_signed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (evidence_id) REFERENCES evidence(id),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_ledger (
      id TEXT PRIMARY KEY,
      sequence_number INTEGER NOT NULL UNIQUE,
      timestamp TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      details_json TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS security_alerts (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      resolved_by TEXT,
      resolved_at TEXT,
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed database if users table is empty
  const userCountResult = await db.execute('SELECT COUNT(*) as count FROM users');
  const userCount = Number(userCountResult.rows[0]?.count || 0);

  if (userCount === 0) {
    await seedDatabase();
  }

  isInitialized = true;
}

async function seedDatabase() {
  console.log('[DB] Seeding database with initial forensic demo data via LibSQL...');
  const now = new Date().toISOString();

  // Create Ed25519 Keypairs for 4 demo users
  const adminKeys = generateEd25519Keypair();
  const invKeys = generateEd25519Keypair();
  const analystKeys = generateEd25519Keypair();
  const auditorKeys = generateEd25519Keypair();

  const adminPass = hashPassword('AdminPass123!');
  const invPass = hashPassword('InvestigatorPass123!');
  const analystPass = hashPassword('AnalystPass123!');
  const auditorPass = hashPassword('AuditorPass123!');

  const users = [
    {
      id: 'USR-ADMIN-001',
      email: 'admin@zerotrust.local',
      name: 'Dr. Sarah Chen (CISO)',
      password_hash: adminPass.hash,
      password_salt: adminPass.salt,
      role: 'Admin',
      ed25519_public_key: adminKeys.publicKey,
      ed25519_private_key: adminKeys.privateKey,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'USR-INV-002',
      email: 'investigator@zerotrust.local',
      name: 'Det. Marcus Vance (Lead Investigator)',
      password_hash: invPass.hash,
      password_salt: invPass.salt,
      role: 'Investigator',
      ed25519_public_key: invKeys.publicKey,
      ed25519_private_key: invKeys.privateKey,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'USR-ANALYST-003',
      email: 'analyst@zerotrust.local',
      name: 'Elena Rostova (Sr. Lab Analyst)',
      password_hash: analystPass.hash,
      password_salt: analystPass.salt,
      role: 'Lab Analyst',
      ed25519_public_key: analystKeys.publicKey,
      ed25519_private_key: analystKeys.privateKey,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'USR-AUDITOR-004',
      email: 'auditor@zerotrust.local',
      name: 'James Sterling (Forensic Auditor)',
      password_hash: auditorPass.hash,
      password_salt: auditorPass.salt,
      role: 'Auditor',
      ed25519_public_key: auditorKeys.publicKey,
      ed25519_private_key: auditorKeys.privateKey,
      created_at: now,
      updated_at: now,
    },
  ];

  for (const u of users) {
    await db.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, password_salt, role, ed25519_public_key, ed25519_private_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.email, u.name, u.password_hash, u.password_salt, u.role, u.ed25519_public_key, u.ed25519_private_key, u.created_at, u.updated_at],
    });
  }

  // Cases
  const cases = [
    {
      id: 'CASE-2026-001',
      title: 'Operation DarkNet - Financial Ransomware Exfiltration',
      description: 'Investigation into targeted LockBit ransomware variant deployed against financial infrastructure. Encrypted drives and C2 memory dumps acquired.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      classification: 'SECRET',
      lead_investigator_id: 'USR-INV-002',
      lead_investigator_name: 'Det. Marcus Vance (Lead Investigator)',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'CASE-2026-002',
      title: 'Corporate Insider IP Data Theft',
      description: 'Exfiltration of proprietary firmware source code via unauthorized cloud storage buckets and encrypted USB drives.',
      status: 'ACTIVE',
      priority: 'HIGH',
      classification: 'CONFIDENTIAL',
      lead_investigator_id: 'USR-INV-002',
      lead_investigator_name: 'Det. Marcus Vance (Lead Investigator)',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'CASE-2026-003',
      title: 'SCADA Network Intrusive Audit',
      description: 'Analysis of unauthorized remote desktop protocol session logs on power plant control terminal.',
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      classification: 'RESTRICTED',
      lead_investigator_id: 'USR-ADMIN-001',
      lead_investigator_name: 'Dr. Sarah Chen (CISO)',
      created_at: now,
      updated_at: now,
    }
  ];

  for (const c of cases) {
    await db.execute({
      sql: `INSERT INTO cases (id, title, description, status, priority, classification, lead_investigator_id, lead_investigator_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.title, c.description, c.status, c.priority, c.classification, c.lead_investigator_id, c.lead_investigator_name, c.created_at, c.updated_at],
    });
  }

  // Seed Evidence Files
  const file1Path = path.join(UPLOAD_DIR, 'EVD-2026-8941_RAM_Dump.raw');
  const file1Content = Buffer.from('FORENSIC_MEMORY_DUMP_HEADER_VOLATILITY_3.0_TARGET_SYSTEM_SRV01_TIMESTAMP_' + Date.now() + '_KEY_EXCHANGE_PAYLOAD_CIPHERTEXT');
  fs.writeFileSync(file1Path, file1Content);
  const hash1 = computeSHA256(file1Content);

  const file2Path = path.join(UPLOAD_DIR, 'EVD-2026-8942_EnCase_Disk.E01');
  const file2Content = Buffer.from('ENCASE_E01_IMAGE_SECTOR_0_MBR_PARTITION_TABLE_NTFS_SYSTEM_VOLUME_ATTRIBUTES_' + Date.now());
  fs.writeFileSync(file2Path, file2Content);
  const hash2 = computeSHA256(file2Content);

  const encryptedMetadataObj = encryptMetadataAES256GCM(JSON.stringify({
    suspect_alias: 'ShadowCoder99',
    informant_confidence: 'HIGH',
    hardware_serial: 'SN-98234-X11',
    c2_ip_address: '185.220.101.5'
  }));

  const evidenceItems = [
    {
      id: 'EVD-2026-8941',
      case_id: 'CASE-2026-001',
      evidence_code: 'EVD-2026-8941',
      name: 'C2 Server Volatile Memory Dump',
      category: 'Memory Dump',
      file_name: 'EVD-2026-8941_RAM_Dump.raw',
      file_path: file1Path,
      file_size: file1Content.length,
      mime_type: 'application/octet-stream',
      sha256_hash: hash1,
      last_verified_hash: hash1,
      last_verified_at: now,
      integrity_status: 'INTACT',
      current_custodian_id: 'USR-INV-002',
      current_custodian_name: 'Det. Marcus Vance (Lead Investigator)',
      acquired_date: now,
      location: 'Secure Evidence Safe Locker #A4',
      encrypted_metadata: JSON.stringify(encryptedMetadataObj),
      created_by: 'USR-INV-002',
      created_at: now,
    },
    {
      id: 'EVD-2026-8942',
      case_id: 'CASE-2026-002',
      evidence_code: 'EVD-2026-8942',
      name: 'Suspect Workstation Disk Image E01',
      category: 'Disk Image',
      file_name: 'EVD-2026-8942_EnCase_Disk.E01',
      file_path: file2Path,
      file_size: file2Content.length,
      mime_type: 'application/octet-stream',
      sha256_hash: hash2,
      last_verified_hash: hash2,
      last_verified_at: now,
      integrity_status: 'INTACT',
      current_custodian_id: 'USR-ANALYST-003',
      current_custodian_name: 'Elena Rostova (Sr. Lab Analyst)',
      acquired_date: now,
      location: 'Forensic Workstation Vault #02',
      encrypted_metadata: null,
      created_by: 'USR-INV-002',
      created_at: now,
    }
  ];

  for (const ev of evidenceItems) {
    await db.execute({
      sql: `INSERT INTO evidence (id, case_id, evidence_code, name, category, file_name, file_path, file_size, mime_type, sha256_hash, last_verified_hash, last_verified_at, integrity_status, current_custodian_id, current_custodian_name, acquired_date, location, encrypted_metadata, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [ev.id, ev.case_id, ev.evidence_code, ev.name, ev.category, ev.file_name, ev.file_path, ev.file_size, ev.mime_type, ev.sha256_hash, ev.last_verified_hash, ev.last_verified_at, ev.integrity_status, ev.current_custodian_id, ev.current_custodian_name, ev.acquired_date, ev.location, ev.encrypted_metadata, ev.created_by, ev.created_at],
    });
  }

  // Audit Ledger Genesis block & initial events
  const genesisPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const initialEvents = [
    {
      seq: 1,
      actor_id: 'USR-ADMIN-001',
      actor_name: 'Dr. Sarah Chen (CISO)',
      actor_role: 'Admin',
      action: 'SYSTEM_INITIALIZATION',
      resource_type: 'SYSTEM',
      resource_id: 'SYS-INIT',
      details: JSON.stringify({ message: 'ZeroTrust Forensics System Vault Initialized' })
    },
    {
      seq: 2,
      actor_id: 'USR-INV-002',
      actor_name: 'Det. Marcus Vance',
      actor_role: 'Investigator',
      action: 'CASE_CREATION',
      resource_type: 'CASE',
      resource_id: 'CASE-2026-001',
      details: JSON.stringify({ title: 'Operation DarkNet - Financial Ransomware Exfiltration' })
    },
    {
      seq: 3,
      actor_id: 'USR-INV-002',
      actor_name: 'Det. Marcus Vance',
      actor_role: 'Investigator',
      action: 'EVIDENCE_REGISTRATION',
      resource_type: 'EVIDENCE',
      resource_id: 'EVD-2026-8941',
      details: JSON.stringify({ sha256: hash1, file_name: 'EVD-2026-8941_RAM_Dump.raw' })
    }
  ];

  let prevHash = genesisPreviousHash;

  for (const evt of initialEvents) {
    const evtId = 'AUD-' + String(evt.seq).padStart(6, '0');
    const evtTimestamp = now;
    const currentHashPayload = `${evt.seq}|${evtTimestamp}|${evt.actor_id}|${evt.action}|${evt.resource_type}|${evt.resource_id}|${evt.details}|${prevHash}`;
    const currentHash = computeSHA256(currentHashPayload);

    await db.execute({
      sql: `INSERT INTO audit_ledger (id, sequence_number, timestamp, actor_id, actor_name, actor_role, action, resource_type, resource_id, details_json, previous_hash, current_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [evtId, evt.seq, evtTimestamp, evt.actor_id, evt.actor_name, evt.actor_role, evt.action, evt.resource_type, evt.resource_id, evt.details, prevHash, currentHash],
    });

    prevHash = currentHash;
  }

  // Security Alert Seed
  await db.execute({
    sql: `INSERT INTO security_alerts (id, category, severity, title, description, resource_type, resource_id, status, created_at)
          VALUES (?, 'SYSTEM_BOOT', 'LOW', 'Forensic Vault System Bootstrapped', 'ZeroTrust Forensics Ledger initialized. 4 cryptographic role keys loaded.', 'SYSTEM', 'SYS-INIT', 'RESOLVED', ?)`,
    args: ['ALT-2026-0001', now],
  });

  console.log('[DB] LibSQL Database seeding completed successfully.');
}

export default db;
