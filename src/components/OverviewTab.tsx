'use client';

import React from 'react';
import {
  FolderLock,
  Database,
  RefreshCw,
  History,
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface OverviewTabProps {
  stats: any;
  recentAlerts: any[];
  recentEvents: any[];
  onNavigate: (tab: string) => void;
  onQuickLogin: (email: string) => void;
  currentUser: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  recentAlerts,
  recentEvents,
  onNavigate,
  onQuickLogin,
  currentUser,
}) => {
  if (!stats) {
    return <div className="p-8 text-center text-slate-400">Loading system metrics...</div>;
  }

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      sub: `${stats.activeCases} Active Cases`,
      icon: FolderLock,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      bgColor: 'bg-cyan-950/20',
      tab: 'cases',
    },
    {
      title: 'Evidence Vault',
      value: stats.totalEvidence,
      sub: stats.tamperedEvidence > 0 ? `${stats.tamperedEvidence} Tamper Alert!` : 'All Checksums Valid',
      icon: Database,
      color: stats.tamperedEvidence > 0 ? 'text-red-400' : 'text-emerald-400',
      borderColor: stats.tamperedEvidence > 0 ? 'border-red-500/40' : 'border-emerald-500/20',
      bgColor: stats.tamperedEvidence > 0 ? 'bg-red-950/30' : 'bg-emerald-950/20',
      tab: 'evidence',
    },
    {
      title: 'Pending Custody Transfers',
      value: stats.pendingTransfers,
      sub: 'Requires Ed25519 Dual Sign',
      icon: RefreshCw,
      color: stats.pendingTransfers > 0 ? 'text-amber-400' : 'text-slate-400',
      borderColor: stats.pendingTransfers > 0 ? 'border-amber-500/40' : 'border-slate-800',
      bgColor: stats.pendingTransfers > 0 ? 'bg-amber-950/20' : 'bg-slate-900/40',
      tab: 'custody',
    },
    {
      title: 'Audit Ledger Chain',
      value: `${stats.auditBlocks} Blocks`,
      sub: stats.ledgerChainIntact ? 'Chain Valid & Cryptographic' : 'CORRUPTED CHAIN DETECTED',
      icon: History,
      color: stats.ledgerChainIntact ? 'text-emerald-400' : 'text-red-400',
      borderColor: stats.ledgerChainIntact ? 'border-emerald-500/20' : 'border-red-500/50',
      bgColor: stats.ledgerChainIntact ? 'bg-emerald-950/20' : 'bg-red-950/40',
      tab: 'audit',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 md:p-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 cyber-border-glow">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-lg text-slate-100">ZeroTrust Digital Forensics Architecture</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl font-mono">
            Every file upload is fingerprinted via SHA-256 on raw intake. Custody transfers enforce dual Ed25519 public-key signature verification. Every system event is stored in an append-only hash-linked audit ledger.
          </p>
        </div>

        <div className="flex space-x-2 w-full md:w-auto">
          <button
            onClick={() => onNavigate('evidence')}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center justify-center space-x-2"
          >
            <span>Register Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.tab)}
              className={`p-4 rounded-xl border ${card.borderColor} ${card.bgColor} cursor-pointer hover:border-cyan-500/40 transition-all space-y-3 group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-lg bg-slate-900/80 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-slate-100 group-hover:text-cyan-400 transition-colors">
                  {card.value}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Demonstration Quick Launcher */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Demo Account Role Switcher (Test RBAC Enforcement)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Click account to test server permission rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              role: 'Admin',
              email: 'admin@zerotrust.local',
              name: 'Dr. Sarah Chen (CISO)',
              desc: 'Full System & User Control',
              color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
            },
            {
              role: 'Investigator',
              email: 'investigator@zerotrust.local',
              name: 'Det. Marcus Vance',
              desc: 'Create Cases & Register Evidence',
              color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
            },
            {
              role: 'Lab Analyst',
              email: 'analyst@zerotrust.local',
              name: 'Elena Rostova',
              desc: 'Verify Hash & Sign Custody Receiver',
              color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
            },
            {
              role: 'Auditor',
              email: 'auditor@zerotrust.local',
              name: 'James Sterling',
              desc: 'Read-only Audit & Ledger Verification',
              color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
            },
          ].map((acc) => {
            const isCurrent = currentUser?.email === acc.email;
            return (
              <button
                key={acc.role}
                onClick={() => onQuickLogin(acc.email)}
                className={`p-3 rounded-lg border ${acc.color} text-left transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 ${
                  isCurrent ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono">{acc.role}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-400 text-black font-bold rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-200 mt-1">{acc.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.desc}</div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1">
                  Pass: {acc.role}Pass123!
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Live Security Alerts & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Active Security Alerts
              </h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              View All ({recentAlerts.length})
            </button>
          </div>

          <div className="space-y-2">
            {recentAlerts.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                No active security alerts. All evidence checksums and signature verifications intact.
              </div>
            ) : (
              recentAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300 font-mono">{alert.title}</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-red-900/80 text-red-200 rounded">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{alert.description}</p>
                  <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1">
                    <span>Category: {alert.category}</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Feed */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Append-Only Audit Ledger Stream
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              Inspect Chain
            </button>
          </div>

          <div className="space-y-2">
            {recentEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                      #{evt.sequence_number}
                    </span>
                    <span className="font-bold text-slate-200">{evt.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Actor: {evt.actor_name} ({evt.actor_role})
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-xs font-mono">
                    Hash: {evt.current_hash.substring(0, 18)}...
                  </div>
                </div>

                <div className="text-[10px] text-slate-500">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
