import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Landmark,
  UserCheck,
  Search,
} from 'lucide-react';
import { User } from '../../types';
import { AuthService } from '../../services/auth.service';
import { getStoredInstitutions, getStoredBanks, subscribeToStorage } from '../../lib/storage';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'INSTITUTIONS' | 'BANKS'>('USERS');

  const institutions = getStoredInstitutions();
  const banks = getStoredBanks();

  useEffect(() => {
    const update = () => {
      setUsers(AuthService.getAllUsers());
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, []);

  const handleApprove = (userId: string) => {
    AuthService.approveUser(userId);
    alert('User authorization approved.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gov-navy" />
          <span>System Administration &bull; Registry & Access Control</span>
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Manage authorized officer credentials, role approvals, institutions, and scheduled bank directories
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`py-3 px-5 border-b-2 transition ${
              activeTab === 'USERS'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            User Accounts & Role Authorization ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('INSTITUTIONS')}
            className={`py-3 px-5 border-b-2 transition ${
              activeTab === 'INSTITUTIONS'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Registered Institutions ({institutions.length})
          </button>
          <button
            onClick={() => setActiveTab('BANKS')}
            className={`py-3 px-5 border-b-2 transition ${
              activeTab === 'BANKS'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Scheduled Commercial Banks ({banks.length})
          </button>
        </div>

        {/* TAB 1: USERS */}
        {activeTab === 'USERS' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Officer / User Name</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  <th className="py-2.5 px-4">Organization Unit</th>
                  <th className="py-2.5 px-4">Account Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-900 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {u.institutionName || u.bankName || 'National Portal Authority'}
                    </td>
                    <td className="py-3 px-4">
                      {u.isApproved ? (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending Authorization
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!u.isApproved && (
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded font-semibold text-[11px] hover:bg-emerald-800"
                        >
                          Approve Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: INSTITUTIONS */}
        {activeTab === 'INSTITUTIONS' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Permanent ID</th>
                  <th className="py-2.5 px-4">Institution Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">State & District</th>
                  <th className="py-2.5 px-4">Contact Person</th>
                  <th className="py-2.5 px-4">Official Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy">
                      {inst.permanentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{inst.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-medium">
                        {inst.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {inst.district}, {inst.state}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{inst.contactPerson}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{inst.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: BANKS */}
        {activeTab === 'BANKS' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Bank Code</th>
                  <th className="py-2.5 px-4">Scheduled Bank Name</th>
                  <th className="py-2.5 px-4">IFSC Prefix</th>
                  <th className="py-2.5 px-4">Institutional Nodal Officer</th>
                  <th className="py-2.5 px-4">Nodal Email</th>
                  <th className="py-2.5 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy">{b.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{b.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.ifscPrefix}</td>
                    <td className="py-3 px-4 text-slate-800">{b.nodalOfficer}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.nodalEmail}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        Simulated Demo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
