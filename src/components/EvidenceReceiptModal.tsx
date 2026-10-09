'use client';

import React from 'react';
import { Award, ShieldCheck, Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface EvidenceReceiptModalProps {
  evidence: any | null;
  onClose: () => void;
}

export const EvidenceReceiptModal: React.FC<EvidenceReceiptModalProps> = ({
  evidence,
  onClose,
}) => {
  if (!evidence) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-xl max-w-xl w-full p-6 space-y-6 font-mono text-xs shadow-[0_0_30px_rgba(6,182,212,0.25)] printable-receipt">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 uppercase tracking-wider">
                Cryptographic Evidence Intake Receipt
              </h3>
              <div className="text-[10px] text-cyan-400 font-mono">
                Official Digital Forensics Integrity Certificate
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="space-y-4 text-slate-300">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded border border-slate-800 text-[11px]">
            <div>
              Evidence Code: <strong className="text-cyan-400">{evidence.evidence_code}</strong>
            </div>
            <div>
              Associated Case: <strong className="text-slate-100">{evidence.case_id}</strong>
            </div>
            <div>
              Artifact Name: <strong className="text-slate-100">{evidence.name}</strong>
            </div>
            <div>
              Category: <strong className="text-slate-100">{evidence.category}</strong>
            </div>
            <div>
              File Size: <strong className="text-slate-100">{evidence.file_size} bytes</strong>
            </div>
            <div>
              MIME Type: <strong className="text-slate-100">{evidence.mime_type}</strong>
            </div>
          </div>

          {/* Genuine SHA-256 Checksum Box */}
          <div className="p-3 bg-slate-950 rounded border border-cyan-500/30 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              Original SHA-256 Cryptographic Digest (Computed at Intake):
            </span>
            <div className="font-mono text-[11px] text-cyan-300 font-bold bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
              {evidence.sha256_hash}
            </div>
          </div>

          {/* Custody & Verification Info */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              Current Custodian: <br />
              <strong className="text-slate-100">{evidence.current_custodian_name}</strong>
            </div>
            <div>
              Acquisition Date: <br />
              <strong className="text-slate-100">{new Date(evidence.acquired_date).toLocaleString()}</strong>
            </div>
            <div>
              Storage Vault Location: <br />
              <strong className="text-slate-100">{evidence.location}</strong>
            </div>
            <div>
              Integrity Status: <br />
              <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{evidence.integrity_status}</span>
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">Verification Certificate Statement:</div>
            <p>
              This receipt confirms that the file bytes were ingested into the ZeroTrust Forensics Vault. The SHA-256 digest represents the immutable fingerprint of the physical item at registration time.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-between items-center no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Close Receipt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
