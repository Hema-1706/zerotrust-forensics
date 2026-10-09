'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  UserCheck,
  FileCheck,
  ArrowRight,
  Clock,
  X,
  Lock,
} from 'lucide-react';

interface CustodyTabProps {
  transfers: any[];
  evidenceList: any[];
  users: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const CustodyTab: React.FC<CustodyTabProps> = ({
  transfers,
  evidenceList,
  users,
  onRefresh,
  currentUser,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [reason, setReason] = useState('Laboratory Forensic Analysis & Extraction');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [signingId, setSigningId] = useState<string | null>(null);

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidenceId || !receiverId || !reason) {
      setFormError('Please select Evidence item, Intended Receiver, and Reason.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/custody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_id: selectedEvidenceId,
          receiver_id: receiverId,
          reason,
          transfer_notes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate transfer');
      }

      setShowTransferModal(false);
      setNotes('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignTransfer = async (transferId: string, action: 'sign' | 'reject') => {
    setSigningId(transferId);
    try {
      const res = await fetch(`/api/custody/${transferId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Signing failed');
      } else {
        alert(data.message);
      }
      onRefresh();
    } catch (err: any) {
      alert('Error during signing: ' + err.message);
    } finally {
      setSigningId(null);
    }
  };

  const availableReceivers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <span>Cryptographic Chain of Custody (Ed25519 Dual Signatures)</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Requires independent Ed25519 public-key signatures from both Sender and Intended Receiver
          </p>
        </div>

        <button
          onClick={() => {
            if (evidenceList.length > 0) setSelectedEvidenceId(evidenceList[0].id);
            if (availableReceivers.length > 0) setReceiverId(availableReceivers[0].id);
            setShowTransferModal(true);
          }}
          className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center space-x-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Custody Transfer</span>
        </button>
      </div>

      {/* Custody Transfers List */}
      <div className="space-y-4">
        {transfers.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            No custody transfer requests on record.
          </div>
        ) : (
          transfers.map((t) => {
            const isPending = t.status === 'PENDING_RECEIVER_SIGNATURE';
            const isCompleted = t.status === 'COMPLETED';
            const isRejected = t.status.includes('REJECTED');
            const isReceiver = currentUser?.id === t.receiver_id || currentUser?.role === 'Admin';

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 font-mono text-xs"
              >
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-cyan-400">{t.id}</span>
                    <span className="text-slate-400">• Evidence:</span>
                    <strong className="text-slate-200">{t.evidence_code} ({t.evidence_name})</strong>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                      isCompleted
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : isPending
                        ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                        : 'bg-red-950 text-red-400 border-red-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Sender & Receiver Dual Flow Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                  {/* Sender Box */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sender: {t.sender_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ed25519 Signature:{' '}
                      <span className="text-emerald-400 font-mono">
                        {t.sender_signature ? t.sender_signature.substring(0, 20) + '...' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Signed At: {t.sender_signed_at ? new Date(t.sender_signed_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  {/* Receiver Box */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      <span>Intended Receiver: {t.receiver_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ed25519 Signature:{' '}
                      <span className={t.receiver_signature ? 'text-emerald-400' : 'text-amber-400'}>
                        {t.receiver_signature ? t.receiver_signature.substring(0, 20) + '...' : 'Awaiting Receiver Key'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Signed At: {t.receiver_signed_at ? new Date(t.receiver_signed_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Reason & Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px]">
                  <div className="text-slate-400">
                    Reason: <span className="text-slate-200">{t.reason}</span>
                  </div>

                  {isPending && isReceiver && (
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleSignTransfer(t.id, 'reject')}
                        className="px-3 py-1.5 rounded bg-red-950/60 text-red-300 hover:bg-red-900 border border-red-800"
                      >
                        Reject Transfer
                      </button>
                      <button
                        onClick={() => handleSignTransfer(t.id, 'sign')}
                        disabled={signingId === t.id}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold flex items-center space-x-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{signingId === t.id ? 'Verifying Keys...' : 'Sign & Accept Custody (Ed25519)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Initiate Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Initiate Cryptographic Custody Transfer</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-500/40 text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleInitiateTransfer} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Select Evidence Item</label>
                <select
                  value={selectedEvidenceId}
                  onChange={(e) => setSelectedEvidenceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {evidenceList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.evidence_code} — {e.name} (Custodial: {e.current_custodian_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Intended Recipient (Next Custodian)</label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {availableReceivers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transfer Justification / Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Dump Volatility Malware Analysis"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional handling notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-cyan-950/40 rounded border border-cyan-800 text-[10px] text-cyan-300">
                Notice: Submitting will sign this transfer request with your Ed25519 Private Key. Custody will shift only when the recipient signs with their key.
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
                >
                  {submitting ? 'Signing Request...' : 'Sign & Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
