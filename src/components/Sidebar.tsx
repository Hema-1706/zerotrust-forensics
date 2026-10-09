'use client';

import React from 'react';
import {
  LayoutDashboard,
  FolderLock,
  Database,
  RefreshCw,
  History,
  ShieldAlert,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertCount: number;
  pendingTransferCount: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAlertCount,
  pendingTransferCount,
  userRole,
}) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'cases', label: 'Cases Directory', icon: FolderLock },
    { id: 'evidence', label: 'Evidence Vault', icon: Database },
    {
      id: 'custody',
      label: 'Custody Transfers',
      icon: RefreshCw,
      badge: pendingTransferCount > 0 ? pendingTransferCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    { id: 'audit', label: 'Audit Ledger Chain', icon: History },
    {
      id: 'alerts',
      label: 'Security Alerts',
      icon: ShieldAlert,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    },
    { id: 'users', label: 'User Directory & RBAC', icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 shrink-0 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <h2 className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
            Navigation Menu
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role Notice Footer */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
        <div className="flex justify-between items-center text-slate-300 font-semibold">
          <span>SECURITY STATUS</span>
          <span className="text-emerald-400">ACTIVE</span>
        </div>
        <div>Active Role: <span className="text-cyan-400">{userRole || 'Guest'}</span></div>
        <div className="text-[10px] text-slate-500">Zero-Trust Authorization Enforced</div>
      </div>
    </aside>
  );
};
