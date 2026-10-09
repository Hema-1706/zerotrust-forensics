const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, 'ZeroTrust_Forensics_Mentor_Presentation_Guide.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });

const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);

// Styling helpers
const primaryColor = '#06B6D4'; // Cyan
const textColor = '#1E293B';
const subTextColor = '#475569';

// Header / Title Page
doc.rect(0, 0, doc.page.width, 120).fill('#0B0F19');

doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('ZEROTRUST FORENSICS', 50, 35);
doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('Digital Forensics Case Management & Cryptographic Custody System', 50, 65);
doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Comprehensive Mentor Presentation Guide, Module Breakdown & Verification Manual', 50, 85);

doc.moveDown(4);

// Section 1: Executive Overview & Problem Statement
doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('1. Executive Overview & Problem Statement', { underline: true });
doc.moveDown(0.5);

doc.fillColor(subTextColor).fontSize(10).font('Helvetica').text(
  'Digital evidence (memory dumps, disk images, log files) collected during cybercrime investigations faces critical vulnerabilities:\n\n' +
  '• Undetected File Alteration: Evidence files can be modified on disk. Without continuous fingerprinting, changes go unnoticed.\n' +
  '• Weak Custody Accountability: Traditional systems record custody as simple text edits, failing to prove who authorized a transfer.\n' +
  '• Editable Audit History: Standard database logs can be altered or deleted by privileged database administrators.\n' +
  '• Superficial Role Controls: Hiding UI buttons fails if backend API endpoints do not strictly enforce server-side authorization.\n\n' +
  'Solution: ZeroTrust Forensics enforces continuous verification across all workflows via raw SHA-256 fingerprinting, dual Ed25519 digital signatures, append-only hash-linked audit ledgers, and AES-256-GCM encryption.',
  { align: 'justify' }
);

doc.moveDown(1.5);

// Section 2: How to Present to your Mentor (Elevator Pitch & Novelty)
doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('2. How to Present to your Mentor (Elevator Pitch & Novelty)', { underline: true });
doc.moveDown(0.5);

doc.fillColor(subTextColor).fontSize(10).font('Helvetica-Bold').text('Key Talking Points for Evaluators:');
doc.moveDown(0.3);

const talkingPoints = [
  {
    title: 'Bi-Directional Tamper Detection (File Level + Chain Level)',
    desc: 'Blockchains only verify that a hash string was logged, but cannot detect if a 20GB physical file on disk was modified. Our system computes fresh SHA-256 hashes off raw file bytes on demand, raising FILE_TAMPERING_DETECTED alerts instantly.'
  },
  {
    title: 'Dual-Party Cryptographic Ed25519 Custody Approval',
    desc: 'Unlike unilateral blockchain pushes, custody transfers stay PENDING until BOTH Sender and Intended Receiver supply independent Ed25519 signatures verified via server-side public key cryptography.'
  },
  {
    title: 'Lightweight Hash-Linked Ledger (Zero Gas Fees)',
    desc: 'Provides the exact tamper-evident mathematical security of a blockchain hash chain without P2P node latency or expensive gas fees.'
  },
  {
    title: 'Interactive Live Anomaly & Tamper Simulator',
    desc: 'Includes built-in Simulate Tampering buttons allowing mentors to flip 1 byte on disk live and watch the system catch the violation.'
  }
];

talkingPoints.forEach(tp => {
  doc.fillColor('#0284C7').fontSize(10).font('Helvetica-Bold').text('• ' + tp.title);
  doc.fillColor(subTextColor).fontSize(9.5).font('Helvetica').text(tp.desc, { indent: 15 });
  doc.moveDown(0.4);
});

doc.addPage();

// Section 3: Module-by-Module Technical Breakdown
doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('3. Module-by-Module Technical Breakdown', { underline: true });
doc.moveDown(0.5);

const modules = [
  {
    name: 'Module 1: Authentication & Server-Enforced RBAC',
    details: 'Passwords hashed using scrypt + 16-byte random salts + timingSafeEqual comparison. Enforces 4 roles: Admin, Investigator, Lab Analyst, and Auditor. Server endpoints validate session cookies on every request.'
  },
  {
    name: 'Module 2: Forensic Case Management Directory',
    details: 'Manages investigation dockets with classification levels (SECRET, CONFIDENTIAL, RESTRICTED, UNCLASSIFIED). Links evidence artifacts, lead investigator details, and audit history.'
  },
  {
    name: 'Module 3: Evidence Vault & SHA-256 Fingerprinting',
    details: 'Computes genuine SHA-256 hash on intake from raw file bytes. Re-verifies disk files on demand. Includes AES-256-GCM metadata encryption and printable Cryptographic Evidence Receipts.'
  },
  {
    name: 'Module 4: Chain of Custody & Ed25519 Dual Signatures',
    details: 'Auto-generates Ed25519 keypairs for all users. Custody transfers require independent digital signatures from both Sender and Receiver before updating current custodian.'
  },
  {
    name: 'Module 5: Append-Only Hash-Linked Audit Ledger',
    details: 'Logs every action in a linked chain: Current_Hash = SHA-256(Seq | Timestamp | Actor | Action | Resource | Details | Prev_Hash). Includes chain verification and repair tools.'
  },
  {
    name: 'Module 6: Security Alerts Center',
    details: 'Monitors anomalies (file tamper alerts, invalid signature attempts, audit chain breaks) with severity levels (CRITICAL, HIGH, MEDIUM, LOW) and auditor resolution notes.'
  }
];

modules.forEach(m => {
  doc.fillColor('#0F766E').fontSize(11).font('Helvetica-Bold').text(m.name);
  doc.fillColor(subTextColor).fontSize(9.5).font('Helvetica').text(m.details);
  doc.moveDown(0.6);
});

doc.moveDown(1);

// Section 4: Step-by-Step Live Working Verification Checklist
doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('4. Step-by-Step Live Working Verification Checklist', { underline: true });
doc.moveDown(0.5);

doc.fillColor(subTextColor).fontSize(9.5).font('Helvetica').text(
  'Follow this exact 10-step walkthrough during your mentor presentation:\n\n' +
  '1. Open http://localhost:3001 in your browser.\n' +
  '2. Click "Investigator" on the Quick Login Bar to sign in as Det. Marcus Vance.\n' +
  '3. Go to "Cases Directory" -> Click "Create New Case Docket".\n' +
  '4. Go to "Evidence Vault" -> Click "Upload & Fingerprint Evidence". Upload any file.\n' +
  '5. Observe the genuine 64-character SHA-256 hash generated automatically.\n' +
  '6. Click "Verify Hash" -> Confirm green INTACT status.\n' +
  '7. Click "Simulate Tamper" -> Click "Verify Hash" -> Watch status turn RED TAMPERED and raise a CRITICAL Alert!\n' +
  '8. Click "Restore File" -> Re-verify to confirm return to INTACT.\n' +
  '9. Go to "Custody Transfers" -> Initiate transfer to Elena Rostova (Lab Analyst). Observe Sender Ed25519 signature.\n' +
  '10. Switch to "Lab Analyst" account -> Click "Sign & Accept Custody" -> Observe dual signature validation & custodian update.'
);

doc.moveDown(1.5);

// Section 5: Pre-Seeded Demo Credentials
doc.fillColor(textColor).fontSize(14).font('Helvetica-Bold').text('5. Demo Credentials Reference', { underline: true });
doc.moveDown(0.5);

doc.fillColor(subTextColor).fontSize(9.5).font('Helvetica').text(
  '• Admin: admin@zerotrust.local / AdminPass123! (Dr. Sarah Chen)\n' +
  '• Investigator: investigator@zerotrust.local / InvestigatorPass123! (Det. Marcus Vance)\n' +
  '• Lab Analyst: analyst@zerotrust.local / AnalystPass123! (Elena Rostova)\n' +
  '• Auditor: auditor@zerotrust.local / AuditorPass123! (James Sterling)'
);

// End Document
doc.end();

stream.on('finish', () => {
  console.log('✓ PDF Presentation Guide compiled successfully at: ' + pdfPath);
});
