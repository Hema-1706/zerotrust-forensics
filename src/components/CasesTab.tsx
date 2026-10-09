'use client';

import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  FileText,
  AlertCircle,
  Database,
  X,
} from 'lucide-react';

interface CasesTabProps {
  cases: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const CasesTab: React.FC<CasesTabProps> = ({
  cases,
  onRefresh,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [classification, setClassification] = useState('CONFIDENTIAL');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, classification }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create case');
      }

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (caseItem: any) => {
    setSelectedCase(caseItem);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/cases/${caseItem.id}`);
      const data = await res.json();
      if (res.ok) {
        setCaseEvidence(data.evidence || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const canCreate = ['Admin', 'Investigator'].includes(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <FolderLock className="w-5 h-5 text-cyan-400" />
            <span>Digital Forensics Cases Directory</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Organized investigation dockets with role-bound evidence vault associations
          </p>
        </div>

        {canCreate ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Case Docket</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            Role: {currentUser?.role} (Read-Only Case Permissions)
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search cases by Title, ID, Keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Cases Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            No matching forensic cases found.
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => handleViewDetails(c)}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    {c.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                      c.classification === 'SECRET'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : c.classification === 'CONFIDENTIAL'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c.classification}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
              </div>

              <div className="space-y-2 border-t border-slate-800/80 pt-3 text-[11px] font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[120px]">{c.lead_investigator_name}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      c.priority === 'CRITICAL'
                        ? 'bg-red-950 text-red-400'
                        : c.priority === 'HIGH'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-cyan-950 text-cyan-400'
                    }`}
                  >
                    {c.priority}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 text-[10px]">
                  <span>Status: <strong className="text-slate-300">{c.status}</strong></span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Case */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-sm text-slate-100 flex items-center space-x-2">
                <FolderLock className="w-4 h-4 text-cyan-400" />
                <span>Initialize Forensic Case Docket</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Ransomware C2 Analysis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description & Scope</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide incident context, target infrastructure details, and forensic objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Security Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECRET">SECRET</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
                >
                  {submitting ? 'Registering...' : 'Save Case Docket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Case Details & Associated Evidence */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedCase.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Classification: {selectedCase.classification}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-100">{selectedCase.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500">Docket Description:</span>
                <p className="text-slate-300 leading-relaxed">{selectedCase.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-400 text-[11px]">
                <div>Lead Investigator: <strong className="text-slate-200">{selectedCase.lead_investigator_name}</strong></div>
                <div>Priority: <strong className="text-cyan-400">{selectedCase.priority}</strong></div>
                <div>Docket Status: <strong className="text-emerald-400">{selectedCase.status}</strong></div>
                <div>Created: <strong className="text-slate-200">{new Date(selectedCase.created_at).toLocaleString()}</strong></div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Associated Evidence Artifacts ({caseEvidence.length})</span>
                </h4>

                {loadingDetails ? (
                  <div className="text-slate-500 py-4 text-center">Loading linked evidence...</div>
                ) : caseEvidence.length === 0 ? (
                  <div className="p-3 rounded bg-slate-950 text-slate-500 text-center">
                    No evidence items uploaded for this case yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{ev.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {ev.evidence_code} • {ev.category} • {ev.file_size} bytes
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            SHA-256: {ev.sha256_hash.substring(0, 24)}...
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            ev.integrity_status === 'INTACT'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {ev.integrity_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
