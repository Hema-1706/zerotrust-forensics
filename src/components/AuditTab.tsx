'use client';

import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Zap,
} from 'lucide-react';

interface AuditTabProps {
  auditEvents: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  auditEvents,
  onRefresh,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<any | null>(null);
  const [tampering, setTampering] = useState(false);

  const filteredEvents = auditEvents.filter((evt) => {
    return (
      evt.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.resource_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.current_hash.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit', { method: 'POST' });
      const data = await res.json();
      setVerificationReport(data.verification);
      onRefresh();
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    } fontFinally: {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async (action: 'tamper' | 'repair') => {
    setTampering(true);
    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sequence_number: 2 }),
      });
      const data = await res.json();
      alert(data.message);
      onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setTampering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Cryptographic Hash-Linked Audit Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Append-only system event blocks linked via SHA-256 prev_hash digest
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black transition-all flex items-center space-x-2 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? 'Recalculating Chain...' : 'Verify Audit Ledger Chain'}</span>
          </button>

          {['Admin', 'Auditor'].includes(currentUser?.role) && (
            <>
              <button
                onClick={() => handleSimulateTamper('tamper')}
                disabled={tampering}
                className="px-3 py-2 text-xs font-mono rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800"
              >
                Simulate DB Tamper
              </button>
              <button
                onClick={() => handleSimulateTamper('repair')}
                disabled={tampering}
                className="px-3 py-2 text-xs font-mono rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800"
              >
                Recalculate & Repair Chain
              </button>
            </>
          )}
        </div>
      </div>

      {/* Verification Report Display */}
      {verificationReport && (
        <div
          className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
            verificationReport.valid
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/50 text-red-300 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <div className="flex items-center space-x-2">
              {verificationReport.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              )}
              <span>
                {verificationReport.valid
                  ? `Cryptographic Audit Ledger Validated: All ${verificationReport.totalBlocks} blocks intact.`
                  : `AUDIT CHAIN BREAK DETECTED at sequence #${verificationReport.brokenSequence}!`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Checked: {new Date(verificationReport.checkedAt).toLocaleTimeString()}
            </span>
          </div>

          {!verificationReport.valid && (
            <p className="text-xs text-red-200 bg-red-950/80 p-3 rounded border border-red-800">
              Error Details: {verificationReport.errorReason}
            </p>
          )}
        </div>
      )}

      {/* Search Filter */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit log by Action, Actor, Hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Audit Stream Timeline */}
      <div className="space-y-3 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500">
            No audit events found.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                    Block #{evt.sequence_number}
                  </span>
                  <span className="font-bold text-slate-100">{evt.action}</span>
                  <span className="text-slate-500">• {evt.resource_type}: {evt.resource_id}</span>
                </div>

                <div className="text-[10px] text-slate-400">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-1">
                <div>
                  Actor: <strong className="text-slate-200">{evt.actor_name}</strong> ({evt.actor_role})
                </div>
                <div className="text-slate-400 font-mono text-[10px] truncate max-w-sm">
                  Details: {evt.details_json}
                </div>
              </div>

              {/* Hash Chain Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2.5 rounded border border-slate-800/80">
                <div className="truncate">
                  Previous Hash: <span className="text-slate-500">{evt.previous_hash}</span>
                </div>
                <div className="truncate">
                  Current Block Hash: <span className="text-cyan-400 font-bold">{evt.current_hash}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
