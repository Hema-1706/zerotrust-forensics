import crypto from 'crypto';

// Master key for AES-256-GCM (32 bytes)
const MASTER_KEY_HEX = process.env.AES_METADATA_MASTER_KEY || '4a8f9c1e2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f';
const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

/**
 * Hash password with scrypt + salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verify password against salt + stored hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(hash, 'hex');
  return crypto.timingSafeEqual(derivedKey, keyBuffer);
}

/**
 * Compute SHA-256 hash of raw Buffer or string
 */
export function computeSHA256(data: Buffer | string): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Generate Ed25519 Keypair (PEM format)
 */
export function generateEd25519Keypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * Sign payload using Ed25519 private key
 */
export function signEd25519(payload: string, privateKeyPem: string): string {
  const signature = crypto.sign(null, Buffer.from(payload, 'utf-8'), privateKeyPem);
  return signature.toString('hex');
}

/**
 * Verify Ed25519 signature
 */
export function verifyEd25519(payload: string, signatureHex: string, publicKeyPem: string): boolean {
  try {
    return crypto.verify(
      null,
      Buffer.from(payload, 'utf-8'),
      publicKeyPem,
      Buffer.from(signatureHex, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Encrypt sensitive string payload using AES-256-GCM
 */
export function encryptMetadataAES256GCM(plainText: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt sensitive metadata payload using AES-256-GCM
 */
export function decryptMetadataAES256GCM(
  ciphertext: string,
  ivHex: string,
  authTagHex: string
): string {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
