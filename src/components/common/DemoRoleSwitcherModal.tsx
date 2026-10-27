import React from 'react';
import { Shield, Building2, Landmark, UserCheck, Settings, RotateCcw, X, Check } from 'lucide-react';
import { User, UserRole } from '../../types';
import { AuthService } from '../../services/auth.service';
import { resetDemoData } from '../../lib/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRoleSwitched: () => void;
}

export const DemoRoleSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onRoleSwitched,
}) => {
  if (!isOpen) return null;

  const users = AuthService.getAllUsers();

  const handleSelectUser = (u: User) => {
    AuthService.switchUser(u);
    onRoleSwitched();
    onClose();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo FDR records, verification results, and audit trails back to the clean hackathon baseline?')) {
      resetDemoData();
      onRoleSwitched();
      onClose();
    }
  };

  const roleMeta: Record<UserRole, { title: string; color: string; icon: React.ReactNode; desc: string }> = {
    INSTITUTION: {
      title: 'Institution User',
      color: 'border-blue-500 bg-blue-50/60 text-blue-900',
      icon: <Building2 className="w-5 h-5 text-blue-700" />,
      desc: 'Submits new FDRs, corrects OCR mistakes, tracks bank verification & responds to clarifications',
    },
    BANK_OFFICER: {
      title: 'Bank Verification Officer',
      color: 'border-emerald-500 bg-emerald-50/60 text-emerald-900',
      icon: <Landmark className="w-5 h-5 text-emerald-700" />,
      desc: 'Inspects receipts, verifies against CBS core ledger, records Confirmed or Mismatch outcomes',
    },
    REGULATORY_OFFICER: {
      title: 'Regulatory Review Officer',
      color: 'border-amber-500 bg-amber-50/60 text-amber-900',
      icon: <UserCheck className="w-5 h-5 text-amber-700" />,
      desc: 'Reviews OCR discrepancies & bank findings, requests clarifications, issues statutory approvals or rejections',
    },
    ADMIN: {
      title: 'System Administrator',
      color: 'border-purple-500 bg-purple-50/60 text-purple-900',
      icon: <Settings className="w-5 h-5 text-purple-700" />,
      desc: 'Manages user authorizations, institutions & bank registry, monitors audit trails and SLA compliance',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gov-navy px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/80 rounded border border-blue-700">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-wide">Prototype Role & Persona Selector</h3>
              <p className="text-xs text-blue-200">
                Switch personas to test isolated workflows and access permissions across the system.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <span className="font-bold px-1.5 py-0.5 bg-amber-200 rounded text-amber-950 uppercase tracking-wider text-[10px]">
            Demo Utility
          </span>
          <span>
            This persona selector is provided strictly for hackathon evaluation. Production instances enforce strict RBAC and SSO.
          </span>
        </div>

        {/* User Card Options */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            const meta = roleMeta[u.role];
            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition flex items-start justify-between gap-4 ${
                  isSelected
                    ? `${meta.color} shadow-xs ring-2 ring-gov-navy/20`
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-white rounded border border-slate-200 shadow-2xs">
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{u.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-800">
                        {meta.title}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {u.designation} &bull; {u.institutionName || u.bankName || 'National Portal Authority'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleResetData}
            className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Database to Baseline
          </button>
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 bg-slate-200 hover:bg-slate-300 font-medium text-slate-800 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
