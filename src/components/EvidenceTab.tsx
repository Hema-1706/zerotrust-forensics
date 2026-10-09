'use client';

import React, { useState } from 'react';
import {
  Database,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle2,
  X,
  Award,
  Zap,
} from 'lucide-react';

interface EvidenceTabProps {
  evidenceList: any[];
  cases: any[];
  onRefresh: () => void;
  currentUser: any;
  onOpenReceipt: (item: any) => void;
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({
  evidenceList,
  cases,
  onRefresh,
  currentUser,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [tamperingId, setTamperingId] = useState<string | null>(null);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [decryptedMetadata, setDecryptedMetadata] = useState<{ id: string; data: any } | null>(null);

  // Upload Form State
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [category, setCategory] = useState('Memory Dump');
  const [location, setLocation] = useState('Vault Safe Locker #A1');
  const [sensitiveNotes, setSensitiveNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.evidence_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sha256_hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesStatus = statusFilter ? item.integrity_status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedCaseId || !evidenceName) {
      setUploadError('Please select a file, target case, and enter evidence name.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('case_id', selectedCaseId);
      formData.append('name', evidenceName);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('sensitive_notes', sensitiveNotes);

      const res = await fetch('/api/evidence', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setShowUploadModal(false);
      setUploadFile(null);
      setEvidenceName('');
      setSensitiveNotes('');
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyIntegrity = async (evidenceId: string) => {
    setVerifyingId(evidenceId);
    setVerifyResult(null);

    try {
      const res = await fetch(`/api/evidence/${evidenceId}/verify`, { method: 'POST' });
      const data = await res.json();
      setVerifyResult(data);
      onRefresh();
    } catch (err: any) {
      setVerifyResult({ success: false, error: err.message });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSimulateTamper = async (evidenceId: string, action: 'tamper' | 'restore') => {
    setTamperingId(evidenceId);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/tamper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      alert(data.message);
      onRefresh();
    } catch (err: any) {
      alert('Tamper simulation error: ' + err.message);
    } finally {
      setTamperingId(null);
    }
  };

  const handleDecryptMetadata = async (evidenceId: string) => {
    setDecryptingId(evidenceId);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/decrypt`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDecryptedMetadata({ id: evidenceId, data: data.decryptedMetadata });
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Decryption error: ' + err.message);
    } finally {
      setDecryptingId(null);
    }
  };

  const canRegister = ['Admin', 'Investigator', 'Lab Analyst'].includes(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Digital Evidence Vault & SHA-256 Checksums</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real file byte intake, SHA-256 checksum tracking, and automated file tamper detection
          </p>
        </div>

        {canRegister && (
          <button
            onClick={() => {
              if (cases.length > 0) setSelectedCaseId(cases[0].id);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center space-x-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Fingerprint Evidence</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between font-mono text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Code, Name, SHA-256..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Categories</option>
            <option value="Memory Dump">Memory Dump</option>
            <option value="Disk Image">Disk Image</option>
            <option value="Network Capture">Network Capture</option>
            <option value="Document">Document</option>
            <option value="Log File">Log File</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Integrity Statuses</option>
            <option value="INTACT">INTACT (Verified)</option>
            <option value="TAMPERED">TAMPERED (Alert)</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
              <th className="p-3">Evidence Code & Name</th>
              <th className="p-3">Case ID</th>
              <th className="p-3">Category & Size</th>
              <th className="p-3">SHA-256 Digest</th>
              <th className="p-3">Current Custodian</th>
              <th className="p-3">Integrity</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvidence.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No evidence items stored in vault.
                </td>
              </tr>
            ) : (
              filteredEvidence.map((item) => {
                const isTampered = item.integrity_status === 'TAMPERED';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isTampered ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-cyan-400">{item.evidence_code}</div>
                    </td>

                    <td className="p-3 text-slate-300">{item.case_id}</td>

                    <td className="p-3">
                      <div className="text-slate-300">{item.category}</div>
                      <div className="text-[10px] text-slate-500">{item.file_size} bytes</div>
                    </td>

                    <td className="p-3">
                      <div className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[160px]" title={item.sha256_hash}>
                        {item.sha256_hash}
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">{item.current_custodian_name}</td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isTampered
                            ? 'bg-red-950/80 text-red-400 border-red-500/50 animate-pulse'
                            : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isTampered ? (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>{item.integrity_status}</span>
                      </span>
                    </td>

                    <td className="p-3 text-right space-x-1.5">
                      {/* Verify Integrity Button */}
                      <button
                        onClick={() => handleVerifyIntegrity(item.id)}
                        disabled={verifyingId === item.id}
                        title="Run SHA-256 File Integrity Check"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 border border-slate-700 transition-colors"
                      >
                        {verifyingId === item.id ? 'Checking...' : 'Verify Hash'}
                      </button>

                      {/* Evidence Receipt Modal Trigger */}
                      <button
                        onClick={() => onOpenReceipt(item)}
                        title="View Cryptographic Receipt"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-950 hover:text-purple-400 text-slate-300 border border-slate-700 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 inline" />
                      </button>

                      {/* Decrypt Metadata (If present) */}
                      {item.encrypted_metadata && (
                        <button
                          onClick={() => handleDecryptMetadata(item.id)}
                          title="Decrypt AES-256-GCM Metadata"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-950 hover:text-amber-400 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5 inline text-amber-400" />
                        </button>
                      )}

                      {/* Simulate Tamper / Restore Toggle for Demo */}
                      {['Admin', 'Investigator', 'Lab Analyst'].includes(currentUser?.role) && (
                        <button
                          onClick={() =>
                            handleSimulateTamper(item.id, isTampered ? 'restore' : 'tamper')
                          }
                          title={isTampered ? 'Restore File Bytes' : 'Simulate Unauthorized File Edit'}
                          className={`px-2 py-1 rounded border text-[10px] ${
                            isTampered
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                              : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900'
                          }`}
                        >
                          {isTampered ? 'Restore File' : 'Simulate Tamper'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Result Dialog */}
      {verifyResult && (
        <div className="p-4 rounded-xl border bg-slate-900 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-sm">
              {verifyResult.match ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              )}
              <span className={verifyResult.match ? 'text-emerald-400' : 'text-red-400'}>
                {verifyResult.message}
              </span>
            </div>
            <button
              onClick={() => setVerifyResult(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] p-3 bg-slate-950 rounded border border-slate-800">
            <div>Original Registered SHA-256: <br /><strong className="text-cyan-400">{verifyResult.originalHash}</strong></div>
            <div>Fresh Disk File SHA-256: <br /><strong className={verifyResult.match ? 'text-emerald-400' : 'text-red-400'}>{verifyResult.currentHash}</strong></div>
          </div>
        </div>
      )}

      {/* Decrypted Metadata Modal */}
      {decryptedMetadata && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-amber-400 flex items-center space-x-2">
                <Unlock className="w-4 h-4" />
                <span>AES-256-GCM Decrypted Metadata</span>
              </h3>
              <button
                onClick={() => setDecryptedMetadata(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-300 space-y-2">
              <pre className="text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(decryptedMetadata.data, null, 2)}
              </pre>
            </div>

            <div className="text-[10px] text-slate-500">
              Decryption authenticated via GCM auth tag and logged in the append-only audit ledger.
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload & Fingerprint Digital Evidence</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-500/40 text-red-300">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Case Docket</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Evidence Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Volatile RAM Dump - Workstation 01"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Memory Dump">Memory Dump</option>
                    <option value="Disk Image">Disk Image</option>
                    <option value="Network Capture">Network Capture</option>
                    <option value="Document">Document</option>
                    <option value="Log File">Log File</option>
                    <option value="Device">Device</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Physical Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Sensitive Metadata (AES-256-GCM Encrypted)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional confidential notes (suspect IP, informant tags, serials)..."
                  value={sensitiveNotes}
                  onChange={(e) => setSensitiveNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">File Upload (Raw Intake)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
                >
                  {uploading ? 'Processing & Hashing...' : 'Ingest & Compute SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
