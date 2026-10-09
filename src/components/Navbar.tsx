'use client';

import React from 'react';
import { Shield, ShieldAlert, LogOut, UserCheck, Key, Lock } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onQuickLogin: (role: string) => void;
  ledgerIntact: boolean;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onQuickLogin,
  ledgerIntact,
  activeAlertCount,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold tracking-wider text-slate-100 text-base md:text-lg">
              ZEROTRUST<span className="text-cyan-400">FORENSICS</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v1.0-PROTOTYPE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono hidden sm:block">
            Digital Forensics Vault • Cryptographic Custody • Hash Ledger
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border ${ledgerIntact ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border-red-500/40 text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${ledgerIntact ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span>Ledger Chain: {ledgerIntact ? 'INTACT' : 'CORRUPTED'}</span>
        </div>

        {activeAlertCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/50 text-red-400 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{activeAlertCount} Active Alert{activeAlertCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right User Bar / Quick Switcher */}
      {user ? (
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user.name}</div>
            <div className="text-[10px] font-mono text-cyan-400 flex items-center justify-end space-x-1">
              <UserCheck className="w-3 h-3" />
              <span>Role: {user.role}</span>
            </div>
          </div>

          <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            {user.role}
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-colors border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">Demo Quick Login:</span>
          <button
            onClick={() => onQuickLogin('admin@zerotrust.local')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900"
          >
            Admin
          </button>
          <button
            onClick={() => onQuickLogin('investigator@zerotrust.local')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900"
          >
            Investigator
          </button>
          <button
            onClick={() => onQuickLogin('analyst@zerotrust.local')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900"
          >
            Analyst
          </button>
          <button
            onClick={() => onQuickLogin('auditor@zerotrust.local')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
          >
            Auditor
          </button>
        </div>
      )}
    </header>
  );
};
