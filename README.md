# ZeroTrust Forensics — Digital Forensics Case Management System

> A portfolio-quality, full-stack Zero-Trust Digital Forensics Case Management & Evidence Vault application engineered with genuine SHA-256 evidence fingerprinting, Ed25519 dual-signature custody transfers, append-only hash-linked audit ledgers, and AES-256-GCM metadata encryption.

---

## 🛡️ Architecture & Security Model

ZeroTrust Forensics enforces continuous verification across all forensic workflows:

```
┌──────────────────┐    SHA-256 Intake    ┌──────────────────────┐
│  Evidence File   │ ───────────────────> │  Raw Byte Fingerprint│
└──────────────────┘                      └──────────────────────┘
         │                                           │
         ▼                                           ▼
┌──────────────────┐    Ed25519 Dual Sign ┌──────────────────────┐
│ Custody Transfer │ ───────────────────> │ Sender & Receiver    │
└──────────────────┘                      │ Public-Key Check     │
         │                                └──────────────────────┘
         ▼                                           │
┌──────────────────┐    Prev-Hash Chain   ┌──────────▼───────────┐
│ Audit Event Log  │ ───────────────────> │ Hash-Linked Ledger   │
└──────────────────┘                      └──────────────────────┘
```

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Cybersecurity Dark Theme Palette)
- **Database**: SQLite (via `@libsql/client` pure-JS driver)
- **Cryptography**: Node.js `crypto` module:
  - **Password Hashing**: `scryptSync` + 16-byte random salt + `timingSafeEqual`
  - **Evidence Integrity**: Raw buffer SHA-256 digests (`createHash('sha256')`)
  - **Custody Signatures**: Asymmetric Ed25519 digital signatures (`generateKeyPairSync`, `sign`, `verify`)
  - **Sensitive Metadata**: AES-256-GCM 256-bit encryption with 96-bit random IVs and GCM authentication tags
  - **Audit Ledger**: Append-only SHA-256 hash-chain recalculation (`prev_hash` linking)
- **Icons & UI**: Lucide React + Tailwind CSS

---

## ⚡ Real Functionality & Implemented Features

### 1. Secure Authentication & Role-Based Access Control (RBAC)
- Password hashing using `scrypt` with unique salts.
- Session cookie validation and server-enforced role authorization matrix:
  - **Admin**: User directory management, full case control, audit inspection, alert resolution.
  - **Investigator**: Case creation, evidence upload & fingerprinting, custody transfer initiation, metadata decryption.
  - **Lab Analyst**: Evidence re-verification, custody transfer signature acceptance, receipt generation.
  - **Auditor**: Read-only case & evidence review, hash-chain ledger verification, security alert remediation.

### 2. Forensic Case Management
- Full Case Docket creation, listing, searching, filtering, and detail drawers.
- Custom classification levels (`SECRET`, `CONFIDENTIAL`, `RESTRICTED`, `UNCLASSIFIED`).
- Automatic evidence item linking and lead investigator assignment.

### 3. Evidence Vault & Genuine SHA-256 Checksums
- Safe local file storage under `./uploads`.
- Real SHA-256 hash computed directly from uploaded file bytes on intake.
- **File Integrity Re-verification**: Re-reads physical file bytes from disk on demand, recalculates fresh SHA-256 digest, and flags mismatches as `TAMPERED`.
- **Tamper Simulation Tool**: Built-in interactive simulator allowing evaluators to flip bytes in stored files to test live alert generation.
- **Cryptographic Evidence Receipt**: Printable/exportable certificate with SHA-256 checksums, timestamps, acquiring officer, and vault location.
- **AES-256-GCM Metadata Encryption**: Confidential evidence notes encrypted with 256-bit GCM keys; accessible only to authorized roles with audit logging.

### 4. Chain of Custody & Dual Ed25519 Signatures
- Independent Ed25519 keypairs auto-generated for every user.
- **Dual-Party Approval Protocol**:
  1. Current Custodian (Sender) initiates transfer and signs payload with Sender's Ed25519 private key.
  2. Intended Receiver logs in and signs acceptance with Receiver's Ed25519 private key.
  3. Server cryptographically verifies BOTH signatures using registered Public Keys before updating custody.
  4. Forged or invalid signatures trigger immediate transfer rejection and high-severity security alerts.

### 5. Append-Only Hash-Linked Audit Ledger
- Immutable event logging with sequence numbering.
- Formula: `Current_Hash = SHA-256(Seq | Timestamp | Actor | Action | Resource | Details | Prev_Hash)`.
- Genesis block initialized with `0000...0000` prev_hash.
- **Ledger Chain Verification**: Recalculates full chain from genesis block to current head to detect database tampering.
- **Database Tamper Simulator & Repair Tool**: Interactive demo features to simulate direct DB alterations and test chain recalculation/repair.

### 6. Security Alerts Center
- Real-time alert feed for integrity failures (`FILE_TAMPERING_DETECTED`), invalid digital signatures (`INVALID_CUSTODY_SIGNATURE`), and ledger chain breaks (`AUDIT_CHAIN_CORRUPTION`).
- Severity levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and auditor remediation workflows.

---

## 🔑 Demo Accounts & Credentials

The system comes pre-seeded with 4 distinct demo accounts representing each security role:

| Role | Email Address | Password | Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@zerotrust.local` | `AdminPass123!` | Dr. Sarah Chen (CISO) |
| **Investigator** | `investigator@zerotrust.local` | `InvestigatorPass123!` | Det. Marcus Vance |
| **Lab Analyst** | `analyst@zerotrust.local` | `AnalystPass123!` | Elena Rostova |
| **Auditor** | `auditor@zerotrust.local` | `AuditorPass123!` | James Sterling |

*Tip: The UI features a Quick Role Switcher bar at the top of the login screen to easily test RBAC rules during evaluation.*

---

## 🚀 Setup & Local Execution

### Prerequisites
- Node.js >= v18.x (Tested on Node.js v22)
- npm >= 9.x

### Installation & Run Steps

1. **Clone / Navigate to Repository Directory**:
   ```bash
   git clone https://github.com/Hema-1706/zerotrust-forensics.git
   cd zerotrust-forensics
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

4. **Start Application Locally**:
   ```bash
   npm run start -- -p 3001
   # OR for development mode:
   npm run dev
   ```

5. **Access Application**:
   Open browser at: `http://localhost:3001` (or `http://localhost:3000`)

---

## 🧪 Automated Test Suite Results

Run `npm test` to execute the automated verification suite:

```
====================================================
ZEROTRUST FORENSICS - AUTOMATED SYSTEM VERIFICATION
====================================================

[TEST 1] Testing Password Scrypt Hashing & Verification...
✓ Passwords Scrypt Hashing & Timing-Safe Verification passed.

[TEST 2] Testing Raw File SHA-256 Computation & Tamper Detection...
✓ Original SHA-256: 905edb7ae44671656844d322...
✓ Tampered SHA-256: 11c9cda3b362c66a2b6dda6d...
✓ SHA-256 File Tamper Detection verified.

[TEST 3] Testing Ed25519 Dual Public-Key Signatures & Verification...
✓ Ed25519 Dual Signatures & Forged Signature Rejection passed.

[TEST 4] Testing AES-256-GCM Authenticated Encryption...
✓ AES-256-GCM Encrypted/Decrypted metadata matches exactly.

[TEST 5] Testing Hash-Linked Audit Ledger Chain Recalculation & LibSQL DB...
✓ LibSQL DB Audit Ledger Chain & Recalculation verified.

====================================================
ALL 5 CORE CRYPTOGRAPHIC & INTEGRITY TESTS PASSED!
====================================================
```

---

## ⚠️ Security Limitations & Production Considerations

1. **Demonstration Scope**: Keypairs are stored locally within SQLite database for prototype convenience. Production deployments should store private keys in Hardware Security Modules (HSM) or smart cards.
2. **Local File Storage**: Files are saved in the local `./uploads` directory. Production installations should use encrypted block storage with WORM (Write Once Read Many) access controls.
3. **Database Immuntability**: While the hash chain detects database tampering, a malicious DBA with full access could rebuild the hash chain unless anchored to an independent external trusted timestamp authority.

---

## 📜 License

MIT License. Designed for academic and portfolio demonstration purposes.
