'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Filter,
  X,
} from 'lucide-react';

interface AlertsTabProps {
  alerts: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  onRefresh,
  currentUser,
}) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesSeverity = severityFilter ? a.severity === severityFilter : true;
    return matchesStatus && matchesSeverity;
  });

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setResolving(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          resolution_notes: resolutionNotes || 'Investigated and marked resolved by auditor',
          status: 'RESOLVED',
        }),
      });

      if (res.ok) {
        setSelectedAlert(null);
        setResolutionNotes('');
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update alert');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const canResolve = ['Admin', 'Auditor'].includes(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Security Alerts & Anomalies Center</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time notifications for SHA-256 file tamper mismatches & Ed25519 signature failures
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3 font-mono text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Alert Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3 font-mono text-xs">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500">
            No security alerts recorded. System operating securely.
          </div>
        ) : (
          filteredAlerts.map((a) => {
            const isActive = a.status === 'ACTIVE';
            return (
              <div
                key={a.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  isActive
                    ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-red-400">{a.id}</span>
                    <span className="text-slate-400">• Category: {a.category}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        a.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        isActive
                          ? 'bg-red-900 text-red-200 animate-pulse'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-100">{a.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{a.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 gap-2">
                  <div>Created: {new Date(a.created_at).toLocaleString()}</div>

                  {isActive && canResolve && (
                    <button
                      onClick={() => setSelectedAlert(a)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-400 text-slate-300 border border-slate-700 transition-colors"
                    >
                      Resolve Alert Docket
                    </button>
                  )}

                  {!isActive && (
                    <div>
                      Resolved by <strong className="text-slate-300">{a.resolved_by}</strong> at{' '}
                      {new Date(a.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Resolve Alert */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Resolve Security Alert {selectedAlert.id}</span>
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveAlert} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Resolution & Remediation Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Document findings, file restoration steps, or audit resolution..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold"
                >
                  {resolving ? 'Updating...' : 'Mark Alert Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
