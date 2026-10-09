'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { OverviewTab } from '@/components/OverviewTab';
import { CasesTab } from '@/components/CasesTab';
import { EvidenceTab } from '@/components/EvidenceTab';
import { CustodyTab } from '@/components/CustodyTab';
import { AuditTab } from '@/components/AuditTab';
import { AlertsTab } from '@/components/AlertsTab';
import { UsersTab } from '@/components/UsersTab';
import { EvidenceReceiptModal } from '@/components/EvidenceReceiptModal';
import { Shield, Lock, Key, ArrowRight } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Application Data States
  const [stats, setStats] = useState<any | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Receipt Modal State
  const [receiptEvidence, setReceiptEvidence] = useState<any | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // Fetch all system data
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [statsRes, casesRes, evidenceRes, transfersRes, auditRes, alertsRes, usersRes] =
        await Promise.all([
          fetch('/api/stats').then((r) => r.json()),
          fetch('/api/cases').then((r) => r.json()),
          fetch('/api/evidence').then((r) => r.json()),
          fetch('/api/custody').then((r) => r.json()),
          fetch('/api/audit').then((r) => r.json()),
          fetch('/api/alerts').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
        ]);

      setStats(statsRes.stats);
      setRecentAlerts(statsRes.recentAlerts || []);
      setRecentEvents(statsRes.recentEvents || []);
      setCases(casesRes.cases || []);
      setEvidenceList(evidenceRes.evidence || []);
      setTransfers(transfersRes.transfers || []);
      setAuditEvents(auditRes.events || []);
      setAlerts(alertsRes.alerts || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error('[App] Failed loading data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const handleLoginSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    const emailToUse = customEmail || loginEmail;
    const passToUse = customPass || loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: passToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setCurrentUser(data.user);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    const roleMap: Record<string, string> = {
      'admin@zerotrust.local': 'AdminPass123!',
      'investigator@zerotrust.local': 'InvestigatorPass123!',
      'analyst@zerotrust.local': 'AnalystPass123!',
      'auditor@zerotrust.local': 'AuditorPass123!',
    };
    handleLoginSubmit(undefined, email, roleMap[email]);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Shield className="w-5 h-5 animate-spin" />
          <span>Authenticating ZeroTrust Vault Session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0F19] cyber-grid-pattern text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 space-y-6 cyber-border-glow shadow-[0_0_40px_rgba(6,182,212,0.15)] font-mono">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100">
              ZEROTRUST<span className="text-cyan-400">FORENSICS</span>
            </h1>
            <p className="text-xs text-slate-400">
              Digital Forensics Case Management & Evidence Vault
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">User Email Address</label>
              <input
                type="email"
                required
                placeholder="investigator@zerotrust.local"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Account Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold transition-all flex items-center justify-center space-x-2"
            >
              <span>{loggingIn ? 'Authenticating...' : 'Sign In to Forensic Vault'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Credentials Quick Switcher */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold text-center">
              Instant Demo Role Sign In
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                onClick={() => handleQuickLogin('admin@zerotrust.local')}
                className="p-2 rounded bg-purple-950/40 border border-purple-800 text-purple-300 hover:bg-purple-900/60 text-left"
              >
                <div className="font-bold">Admin</div>
                <div className="text-slate-400">admin@zerotrust.local</div>
              </button>
              <button
                onClick={() => handleQuickLogin('investigator@zerotrust.local')}
                className="p-2 rounded bg-cyan-950/40 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 text-left"
              >
                <div className="font-bold">Investigator</div>
                <div className="text-slate-400">investigator@zerotrust.local</div>
              </button>
              <button
                onClick={() => handleQuickLogin('analyst@zerotrust.local')}
                className="p-2 rounded bg-blue-950/40 border border-blue-800 text-blue-300 hover:bg-blue-900/60 text-left"
              >
                <div className="font-bold">Lab Analyst</div>
                <div className="text-slate-400">analyst@zerotrust.local</div>
              </button>
              <button
                onClick={() => handleQuickLogin('auditor@zerotrust.local')}
                className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60 text-left"
              >
                <div className="font-bold">Auditor</div>
                <div className="text-slate-400">auditor@zerotrust.local</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const pendingTransferCount = transfers.filter((t) => t.status === 'PENDING_RECEIVER_SIGNATURE').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
        ledgerIntact={stats ? stats.ledgerChainIntact : true}
        activeAlertCount={activeAlertCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeAlertCount={activeAlertCount}
          pendingTransferCount={pendingTransferCount}
          userRole={currentUser?.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Mobile Tab Select */}
          <div className="md:hidden mb-4 font-mono text-xs">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-cyan-400 font-bold"
            >
              <option value="overview">Dashboard Overview</option>
              <option value="cases">Cases Directory</option>
              <option value="evidence">Evidence Vault</option>
              <option value="custody">Custody Transfers ({pendingTransferCount})</option>
              <option value="audit">Audit Ledger Chain</option>
              <option value="alerts">Security Alerts ({activeAlertCount})</option>
              <option value="users">User Directory & RBAC</option>
            </select>
          </div>

          {/* Active Tab View Rendering */}
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              recentAlerts={recentAlerts}
              recentEvents={recentEvents}
              onNavigate={setActiveTab}
              onQuickLogin={handleQuickLogin}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'cases' && (
            <CasesTab
              cases={cases}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceTab
              evidenceList={evidenceList}
              cases={cases}
              onRefresh={loadData}
              currentUser={currentUser}
              onOpenReceipt={setReceiptEvidence}
            />
          )}

          {activeTab === 'custody' && (
            <CustodyTab
              transfers={transfers}
              evidenceList={evidenceList}
              users={users}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTab
              auditEvents={auditEvents}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              onRefresh={loadData}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Cryptographic Evidence Receipt Modal */}
      <EvidenceReceiptModal
        evidence={receiptEvidence}
        onClose={() => setReceiptEvidence(null)}
      />
    </div>
  );
}
