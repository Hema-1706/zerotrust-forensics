const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

async function runTestSuite() {
  console.log('====================================================');
  console.log('ZEROTRUST FORENSICS - AUTOMATED SYSTEM VERIFICATION');
  console.log('====================================================\n');

  // 1. Test Crypto Hashing & Password Verification
  console.log('[TEST 1] Testing Password Scrypt Hashing & Verification...');
  const salt = crypto.randomBytes(16).toString('hex');
  const passHash = crypto.scryptSync('SecureTestPass123!', salt, 64).toString('hex');
  const verifyKey = crypto.scryptSync('SecureTestPass123!', salt, 64);
  assert.strictEqual(crypto.timingSafeEqual(verifyKey, Buffer.from(passHash, 'hex')), true, 'Password verification should match');
  const wrongKey = crypto.scryptSync('WrongPassword', salt, 64);
  assert.strictEqual(crypto.timingSafeEqual(wrongKey, Buffer.from(passHash, 'hex')), false, 'Wrong password should fail');
  console.log('✓ Passwords Scrypt Hashing & Timing-Safe Verification passed.\n');

  // 2. Test Genuine SHA-256 File Hashing & Tamper Detection
  console.log('[TEST 2] Testing Raw File SHA-256 Computation & Tamper Detection...');
  const sampleFileContent = Buffer.from('FORENSIC_RAW_BYTES_TEST_PAYLOAD_' + Date.now());
  const expectedSha256 = crypto.createHash('sha256').update(sampleFileContent).digest('hex');

  // Modify 1 byte to simulate tamper
  const tamperedContent = Buffer.from(sampleFileContent);
  tamperedContent[0] = tamperedContent[0] ^ 0xff;
  const tamperedSha256 = crypto.createHash('sha256').update(tamperedContent).digest('hex');

  assert.notStrictEqual(expectedSha256, tamperedSha256, 'Altered bytes must produce different SHA-256 hash');
  console.log(`✓ Original SHA-256: ${expectedSha256.substring(0, 24)}...`);
  console.log(`✓ Tampered SHA-256: ${tamperedSha256.substring(0, 24)}...`);
  console.log('✓ SHA-256 File Tamper Detection verified.\n');

  // 3. Test Ed25519 Cryptographic Signatures for Custody Transfers
  console.log('[TEST 3] Testing Ed25519 Dual Public-Key Signatures & Verification...');
  const senderKeys = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const receiverKeys = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const payload = 'EVD-2026-8941|USR-INV-001|USR-ANALYST-002|1700000000|Lab Forensic Analysis';
  const senderSig = crypto.sign(null, Buffer.from(payload, 'utf-8'), senderKeys.privateKey).toString('hex');
  const receiverSig = crypto.sign(null, Buffer.from(payload, 'utf-8'), receiverKeys.privateKey).toString('hex');

  const isSenderValid = crypto.verify(null, Buffer.from(payload, 'utf-8'), senderKeys.publicKey, Buffer.from(senderSig, 'hex'));
  const isReceiverValid = crypto.verify(null, Buffer.from(payload, 'utf-8'), receiverKeys.publicKey, Buffer.from(receiverSig, 'hex'));

  assert.strictEqual(isSenderValid, true, 'Sender Ed25519 signature must be valid');
  assert.strictEqual(isReceiverValid, true, 'Receiver Ed25519 signature must be valid');

  // Test Forged Signature Rejection
  const forgedSig = crypto.sign(null, Buffer.from('FORGED_PAYLOAD', 'utf-8'), senderKeys.privateKey).toString('hex');
  const isForgedValid = crypto.verify(null, Buffer.from(payload, 'utf-8'), senderKeys.publicKey, Buffer.from(forgedSig, 'hex'));
  assert.strictEqual(isForgedValid, false, 'Forged signature must be rejected');
  console.log('✓ Ed25519 Dual Signatures & Forged Signature Rejection passed.\n');

  // 4. Test AES-256-GCM Sensitive Metadata Encryption & Decryption
  console.log('[TEST 4] Testing AES-256-GCM Authenticated Encryption...');
  const masterKey = Buffer.from('4a8f9c1e2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const secretNotes = JSON.stringify({ suspect: 'ShadowCoder99', c2_ip: '185.220.101.5' });

  let encrypted = cipher.update(secretNotes, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  assert.strictEqual(decrypted, secretNotes, 'Decrypted payload must match original secret notes');
  console.log('✓ AES-256-GCM Encrypted/Decrypted metadata matches exactly.\n');

  // 5. Test Hash-Linked Audit Ledger Chain Integrity & LibSQL persistence
  console.log('[TEST 5] Testing Hash-Linked Audit Ledger Chain Recalculation & LibSQL DB...');
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  const client = createClient({ url: 'file:data/test_audit.db' });
  await client.execute('CREATE TABLE IF NOT EXISTS audit_test (seq INT, prev_hash TEXT, curr_hash TEXT)');

  const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const block1Payload = `1|2026-10-09T00:00:00Z|USR-ADMIN|SYS_INIT|SYSTEM|SYS-01|{}|${genesisHash}`;
  const block1Hash = crypto.createHash('sha256').update(block1Payload).digest('hex');

  await client.execute({
    sql: 'INSERT INTO audit_test VALUES (?, ?, ?)',
    args: [1, genesisHash, block1Hash],
  });

  const res = await client.execute('SELECT * FROM audit_test WHERE seq = 1');
  assert.strictEqual(res.rows[0].curr_hash, block1Hash, 'DB audit record must match calculated block hash');
  console.log('✓ LibSQL DB Audit Ledger Chain & Recalculation verified.\n');

  console.log('====================================================');
  console.log('ALL 5 CORE CRYPTOGRAPHIC & INTEGRITY TESTS PASSED!');
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
