import React, { useState } from 'react';
import {
  Settings,
  Database,
  Clock,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { getBackendStatus } from '../../lib/supabase';
import { resetDemoData } from '../../lib/storage';

export const SettingsPage: React.FC = () => {
  const backend = getBackendStatus();

  const [bankSla, setBankSla] = useState(3);
  const [regulatorySla, setRegulatorySla] = useState(7);
  const [releaseSla, setReleaseSla] = useState(14);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSla = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all FDR records, audit logs, and cases back to clean hackathon demo baseline?')) {
      resetDemoData();
      alert('Database restored to default demo fixtures.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gov-navy" />
          <span>System Architecture & Workflow Configuration</span>
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Configure statutory service-level agreements (SLAs), review backend connectivity, and manage prototype fixtures
        </p>
      </div>

      {/* Backend Integration Status Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Database className="w-4 h-4 text-gov-navy" />
            <span>Backend & Persistence Architecture Status</span>
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              backend.isConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-900 border border-blue-200'
            }`}
          >
            Mode: {backend.mode}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-slate-700 leading-relaxed">{backend.description}</p>
          <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div>
              <span className="text-slate-400">STORAGE_ADAPTER:</span> LocalStorage Engine (Offline-First Persistent)
            </div>
            <div>
              <span className="text-slate-400">SUPABASE_CLIENT:</span> Ready for credentials in .env (VITE_SUPABASE_URL)
            </div>
            <div>
              <span className="text-slate-400">SQL_MIGRATIONS:</span> Available at /supabase/migrations/
            </div>
          </div>
        </div>
      </div>

      {/* SLA Configuration Form */}
      <form
        onSubmit={handleSaveSla}
        className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs"
      >
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-gov-navy" />
            <span>Configurable Statutory Service Level Agreement (SLA) Targets</span>
          </h3>
          <p className="text-slate-500 text-[11px]">
            Define threshold days before a case in a given stage triggers visual severity escalation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bank Verification SLA (Days):
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={bankSla}
              onChange={(e) => setBankSla(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 3 Days</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Regulatory Review SLA (Days):
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={regulatorySla}
              onChange={(e) => setRegulatorySla(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 7 Days</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Release Clearance SLA (Days):
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={releaseSla}
              onChange={(e) => setReleaseSla(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 14 Days</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {isSaved ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-4 h-4" /> Service targets updated successfully.
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-gov-navy text-white font-semibold rounded hover:bg-blue-900 transition"
          >
            Save Target Thresholds
          </button>
        </div>
      </form>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Reset Prototype Database</span>
        </h3>
        <p className="text-slate-600 leading-relaxed">
          Restore all institution FDR cases, verification outcomes, and audit histories back to the initial demonstration fixtures.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 rounded font-semibold hover:bg-rose-100 transition"
        >
          Reset to Baseline Demonstration Fixtures
        </button>
      </div>
    </div>
  );
};
