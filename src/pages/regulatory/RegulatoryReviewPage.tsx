import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Building2,
  Landmark,
  FileText,
  Clock,
} from 'lucide-react';
import { User, FDRRecord } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, formatDateTime, getStatusBadge } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const RegulatoryReviewPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [selectedFdr, setSelectedFdr] = useState<FDRRecord | null>(null);

  // Decision Form State
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'CLARIFY' | 'FURTHER_VERIF'>('APPROVE');
  const [justification, setJustification] = useState('');
  const [clarificationDetails, setClarificationDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checklist items
  const [checklist, setChecklist] = useState({
    lienMarked: true,
    bankConfirmed: true,
    amountSufficient: true,
    tenureCompliant: true,
  });

  useEffect(() => {
    const update = () => {
      const all = FDRService.getAllFDRs(undefined, currentUser);
      setFdrs(all);
      if (!selectedFdr && all.length > 0) {
        // Prioritize under review, or clarification, or first
        const reviewCase =
          all.find((f) => f.status === 'Under Regulatory Review') ||
          all.find((f) => f.status === 'Clarification Required') ||
          all[0];
        setSelectedFdr(reviewCase);
      } else if (selectedFdr) {
        const updated = all.find((f) => f.id === selectedFdr.id);
        if (updated) setSelectedFdr(updated);
      }
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdr) return;

    if (!justification.trim()) {
      alert('A formal justification reason is strictly mandatory for regulatory decisions.');
      return;
    }

    if (actionType === 'CLARIFY' && !clarificationDetails.trim()) {
      alert('Please specify the exact clarification required from the institution.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to record the statutory decision "${actionType}" for FDR ${selectedFdr.fdrNumber}? This action is logged permanently to the audit trail.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      let mappedDecision: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED' | 'FURTHER_VERIFICATION' =
        'APPROVED';

      if (actionType === 'REJECT') mappedDecision = 'REJECTED';
      if (actionType === 'CLARIFY') mappedDecision = 'CLARIFICATION_REQUIRED';
      if (actionType === 'FURTHER_VERIF') mappedDecision = 'FURTHER_VERIFICATION';

      FDRService.submitRegulatoryDecision(selectedFdr.id, {
        decision: mappedDecision,
        reason: justification.trim(),
        clarificationNote: clarificationDetails.trim(),
        conditions: ['Statutory lien active', 'Non-encashable without written regulatory consent'],
      });

      setIsSubmitting(false);
      alert(`Statutory decision "${mappedDecision}" successfully recorded.`);
      setJustification('');
      setClarificationDetails('');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Regulatory Review & Statutory Approval Cockpit
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 uppercase">
              Statutory Bureau
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Review FDR receipts, OCR discrepancy analyses, and bank verification evidence before issuing statutory approvals.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded text-[11px] text-slate-600">
          Reviewer: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.designation || 'Director, Finance & Approvals'})
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Review Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[780px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Regulatory Cases Queue</span>
            <span className="bg-gov-navy text-white text-[10px] px-2 py-0.5 rounded-full">
              {fdrs.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {fdrs.map((item) => {
              const isSelected = selectedFdr?.id === item.id;
              const badge = getStatusBadge(item.status);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedFdr(item)}
                  className={`p-3 rounded-md cursor-pointer transition text-xs border ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{item.fdrNumber}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium truncate mt-1">
                    {item.institutionName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span className="font-semibold text-slate-900">{formatINR(item.principalAmount)}</span>
                    <span className="text-[10px] font-bold text-slate-600">Bank: {item.bankVerification.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Cockpit (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedFdr ? (
            <>
              {/* Summary Overview */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {selectedFdr.fdrNumber} &bull; Case Review dossier
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Permanent ID: {selectedFdr.institutionPermanentId} &bull; Category: {selectedFdr.depositCategory}
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

                {/* Evidence Checks Strip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Verification Evidence */}
                  <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-gov-navy" />
                      <span>Bank Verification Evidence:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Outcome:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedFdr.bankVerification.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {selectedFdr.bankVerification.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Officer: {selectedFdr.bankVerification.assignedOfficerName || 'Bank Institutional Desk'}
                    </p>
                    {selectedFdr.bankVerification.comments && (
                      <p className="text-slate-700 italic text-[11px] bg-white p-2 rounded border border-slate-200">
                        "{selectedFdr.bankVerification.comments}"
                      </p>
                    )}
                  </div>

                  {/* OCR & Document Integrity */}
                  <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gov-navy" />
                      <span>OCR Extraction & Document Integrity:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Confidence:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedFdr.ocrConfidenceAverage}%
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Discrepancies Flagged: <strong>{selectedFdr.discrepancies.length}</strong>
                    </p>
                    {selectedFdr.discrepancies.length > 0 && (
                      <div className="text-rose-900 font-semibold text-[11px] bg-rose-50 p-2 rounded border border-rose-200">
                        {selectedFdr.discrepancies[0].title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statutory Review Checklist */}
                <div className="border border-slate-200 rounded p-4 bg-white space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wide block">
                    Statutory Compliance Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.lienMarked}
                        onChange={(e) => setChecklist({ ...checklist, lienMarked: e.target.checked })}
                        className="rounded text-gov-navy border-slate-300"
                      />
                      <span className="text-slate-700">Lien endorsed in favor of Member Secretary</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.bankConfirmed}
                        onChange={(e) => setChecklist({ ...checklist, bankConfirmed: e.target.checked })}
                        className="rounded text-gov-navy border-slate-300"
                      />
                      <span className="text-slate-700">Confirmed by Scheduled Commercial Bank</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.amountSufficient}
                        onChange={(e) => setChecklist({ ...checklist, amountSufficient: e.target.checked })}
                        className="rounded text-gov-navy border-slate-300"
                      />
                      <span className="text-slate-700">Principal matches prescribed norm amount</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.tenureCompliant}
                        onChange={(e) => setChecklist({ ...checklist, tenureCompliant: e.target.checked })}
                        className="rounded text-gov-navy border-slate-300"
                      />
                      <span className="text-slate-700">Minimum lock-in tenure requirements met</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Form */}
              <form
                onSubmit={handleDecisionSubmit}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs"
              >
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Record Statutory Decision</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Mandatory official justification required
                  </span>
                </div>

                {/* Action Buttons Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('APPROVE')}
                    className={`p-3 rounded border font-semibold flex flex-col items-center gap-1.5 transition ${
                      actionType === 'APPROVE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Approve Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('REJECT')}
                    className={`p-3 rounded border font-semibold flex flex-col items-center gap-1.5 transition ${
                      actionType === 'REJECT'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Reject Case</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('CLARIFY')}
                    className={`p-3 rounded border font-semibold flex flex-col items-center gap-1.5 transition ${
                      actionType === 'CLARIFY'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                    <span>Request Clarification</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('FURTHER_VERIF')}
                    className={`p-3 rounded border font-semibold flex flex-col items-center gap-1.5 transition ${
                      actionType === 'FURTHER_VERIF'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <span>Further Verification</span>
                  </button>
                </div>

                {/* Conditional Clarification input */}
                {actionType === 'CLARIFY' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Clarification Query for Institution <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={clarificationDetails}
                      onChange={(e) => setClarificationDetails(e.target.value)}
                      placeholder="e.g. Upload bank addendum certifying 36-month validity instead of 24 months."
                      className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Statutory Decision Justification <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Enter formal reasons and regulatory provisions justifying this determination..."
                    className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gov-navy hover:bg-blue-900 disabled:opacity-50 text-white font-bold rounded shadow-xs transition"
                  >
                    {isSubmitting ? 'Recording Decision...' : 'Record Regulatory Determination'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
              Select an FDR record from the regulatory queue to review and decide.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
