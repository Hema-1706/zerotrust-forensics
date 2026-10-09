'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Key,
  Shield,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';

interface UsersTabProps {
  users: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onRefresh,
  currentUser,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Investigator' | 'Lab Analyst' | 'Auditor'>('Investigator');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPassword('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  const roleMatrix = [
    { role: 'Admin', cases: 'Full Read/Write', evidence: 'Full Read/Write', custody: 'Override', audit: 'View & Verify', alerts: 'Resolve' },
    { role: 'Investigator', cases: 'Create/Edit', evidence: 'Upload/Verify/Decrypt', custody: 'Initiate/Sign', audit: 'View Ledger', alerts: 'View' },
    { role: 'Lab Analyst', cases: 'View Assigned', evidence: 'Verify Integrity', custody: 'Accept Transfer', audit: 'View Ledger', alerts: 'View' },
    { role: 'Auditor', cases: 'Read-Only', evidence: 'Read-Only', custody: 'View History', audit: 'Verify Chain', alerts: 'Resolve' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-mono font-bold text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>User Directory & Server-Enforced RBAC Permissions</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Every user account possesses a unique cryptographic Ed25519 public key for transfer signing
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New User Account</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            Admin role required to register new personnel accounts
          </div>
        )}
      </div>

      {/* RBAC Matrix Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
        <h3 className="font-bold text-slate-200 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Server Authorization Permission Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="p-2">Role Title</th>
                <th className="p-2">Cases Directory</th>
                <th className="p-2">Evidence Vault</th>
                <th className="p-2">Custody Signatures</th>
                <th className="p-2">Audit Chain</th>
                <th className="p-2">Security Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {roleMatrix.map((r) => (
                <tr key={r.role}>
                  <td className="p-2 font-bold text-cyan-400">{r.role}</td>
                  <td className="p-2">{r.cases}</td>
                  <td className="p-2">{r.evidence}</td>
                  <td className="p-2">{r.custody}</td>
                  <td className="p-2">{r.audit}</td>
                  <td className="p-2">{r.alerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
              <th className="p-3">User ID & Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Role</th>
              <th className="p-3">Ed25519 Public Key Fingerprint</th>
              <th className="p-3 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-bold text-slate-200">{u.name}</div>
                  <div className="text-[10px] text-cyan-400">{u.id}</div>
                </td>
                <td className="p-3 text-slate-300">{u.email}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]" title={u.ed25519_public_key}>
                    {u.ed25519_public_key.replace(/\n/g, '').substring(0, 32)}...
                  </div>
                </td>
                <td className="p-3 text-right text-slate-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Register User & Generate Ed25519 Keypair</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agent Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@zerotrust.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned System Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Investigator">Investigator</option>
                  <option value="Lab Analyst">Lab Analyst</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
                >
                  {submitting ? 'Generating Keys...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
