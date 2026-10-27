import React from 'react';
import { ShieldCheck, Lock, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 px-4 sm:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side Notice */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="p-2 rounded bg-slate-800 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">
              FDR Guardian &bull; Explainable Security Deposit Verification Engine
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Demonstration prototype built for Hackathon showcase. Not an authorized government portal. Bank verification data is simulated.
            </p>
          </div>
        </div>

        {/* Right Compliance & Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Document Verification
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Helpdesk: support@fdrguardian.demo.gov.in
          </span>
          <span className="text-slate-400 font-mono">Build 2026.10-RC</span>
        </div>
      </div>
    </footer>
  );
};
