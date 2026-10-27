import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { User, FDRRecord } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, formatDateTime, getStatusBadge } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const BankVerificationPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [selectedFdr, setSelectedFdr] = useState<FDRRecord | null>(null);

  // Form State
  const [outcome, setOutcome] = useState<'CONFIRMED' | 'MISMATCH' | 'UNABLE_TO_VERIFY' | 'INFO_REQUIRED'>('CONFIRMED');
  const [cbsRef, setCbsRef] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const update = () => {
      const all = FDRService.getAllFDRs(undefined, currentUser);
      setFdrs(all);
      if (!selectedFdr && all.length > 0) {
        // Select first pending if available, or first item
        const pending = all.find((f) => f.bankVerification.status === 'PENDING') || all[0];
        setSelectedFdr(pending);
      } else if (selectedFdr) {
        // keep updated
        const updated = all.find((f) => f.id === selectedFdr.id);
        if (updated) setSelectedFdr(updated);
      }
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  const handleRecordVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdr) return;
    if (!cbsRef.trim() || !comments.trim()) {
      alert('CBS Reference Token and Official Comments are required.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      FDRService.submitBankVerification(selectedFdr.id, {
        status: outcome,
        referenceNumber: cbsRef.trim(),
        comments: comments.trim(),
      });
      setIsSubmitting(false);
      alert(`Bank Verification recorded as: ${outcome}. Case updated in portal registry.`);
      setCbsRef('');
      setComments('');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Simulated Bank Notice */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Bank Officer Verification Desk
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
              Simulated CBS Ledger &bull; Demo Only
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Reconcile submitted institutional FDR receipts against Core Banking Solution (CBS) ledgers.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded text-[11px] text-slate-600">
          Logged Officer: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.bankName || 'State Bank of India'})
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[750px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Assigned Verification Queue</span>
            <span className="bg-gov-navy text-white text-[10px] px-2 py-0.5 rounded-full">
              {fdrs.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {fdrs.map((item) => {
              const isSelected = selectedFdr?.id === item.id;
              const isPending = item.bankVerification.status === 'PENDING';
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedFdr(item)}
                  className={`p-3 rounded-md cursor-pointer transition text-xs border ${
                    isSelected
                      ? 'bg-blue-50/80 border-gov-navy shadow-2xs'
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{item.fdrNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.bankVerification.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.bankVerification.status === 'MISMATCH'
                          ? 'bg-rose-100 text-rose-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.bankVerification.status}
                    </span>
                  </div>

                  <div className="text-slate-700 font-medium truncate mt-1">
                    {item.institutionName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span className="font-semibold text-slate-900">
                      {formatINR(item.principalAmount)}
                    </span>
                    <span>{item.bankName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail & Verification Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedFdr ? (
            <>
              {/* Case Parameters Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {selectedFdr.fdrNumber} &bull; Case Ledger Verification
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Submitted by {selectedFdr.institutionName} on {formatDate(selectedFdr.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/fdr/${selectedFdr.id}`)}
                    className="text-xs font-semibold text-gov-navy hover:underline flex items-center gap-1"
                  >
                    <span>Full Case Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-medium">Principal Amount:</span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {formatINR(selectedFdr.principalAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Deposit Holder:</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                      {selectedFdr.holderName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Maturity Date:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {formatDate(selectedFdr.maturityDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Lien Endorsed:</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                      {selectedFdr.lienMarkedTo}
                    </p>
                  </div>
                </div>

                {/* Simulated CBS Core Banking Comparison Panel */}
                <div className="border border-slate-200 rounded p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-gov-navy" />
                      <span>Simulated Core Banking Ledger Record (CBS Feed)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Query Time: {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded">
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px]">
                        CBS CERTIFICATE ID:
                      </span>
                      <span className="text-amber-400 font-bold">{selectedFdr.fdrNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px]">
                        CBS LEDGER PRINCIPAL:
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {selectedFdr.status === 'Bank Mismatch' ? '₹20,00,000.00 (VARIANCE)' : formatINR(selectedFdr.principalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans text-[10px]">
                        CBS LIEN STATUS:
                      </span>
                      <span className="text-blue-400 font-bold">REGISTERED (AICTE / STATE)</span>
                    </div>
                  </div>
                </div>

                {/* Discrepancies if any */}
                {selectedFdr.discrepancies.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded text-[11px] text-rose-950 space-y-1">
                    <div className="font-bold text-rose-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>OCR & System Flagged Discrepancies:</span>
                    </div>
                    {selectedFdr.discrepancies.map((d) => (
                      <p key={d.id} className="text-slate-700">
                        &bull; <strong className="font-semibold text-rose-900">{d.title}:</strong> {d.explanation}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Form */}
              <form
                onSubmit={handleRecordVerification}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs"
              >
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Record Official Bank Verification Determination</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Mandatory for regulatory lien acceptance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Verification Outcome <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
                    >
                      <option value="CONFIRMED">Confirmed — CBS Ledger Matched & Active</option>
                      <option value="MISMATCH">Mismatch — Financial or Parameter Variance</option>
                      <option value="INFO_REQUIRED">Information Required — Clarification Needed</option>
                      <option value="UNABLE_TO_VERIFY">Unable to Verify — Record Not Located</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      CBS Verification Reference / Token <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={cbsRef}
                      onChange={(e) => setCbsRef(e.target.value)}
                      placeholder="e.g. SBI-CBS-AUTH-2024-88912"
                      className="w-full p-2.5 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Officer Comments & Ledger Evidence Notes <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter verification comments, branch manager endorsement notes, or discrepancy observations..."
                      className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                  <strong>Notice:</strong> Submitting a Bank Confirmation registers the deposit as confirmed by the bank, which advances the case to the Regulatory Review Officer. Bank confirmation does not automatically grant regulatory approval.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded shadow-xs transition"
                  >
                    {isSubmitting ? 'Recording...' : 'Submit Official Bank Verification'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
              Select an FDR record from the queue to review and verify.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
