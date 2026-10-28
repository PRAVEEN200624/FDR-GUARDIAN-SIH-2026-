import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Landmark,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Download,
  Edit3,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Clock,
  ShieldCheck,
  HelpCircle,
  FileSearch,
  MessageSquare,
  AlertOctagon,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { FDRRecord, User, FDRWorkflowStatus } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { AuditService } from '../../services/audit.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, formatDateTime, getStatusBadge, getMaturityDaysInfo } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const FDRDetailPage: React.FC<Props> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState<FDRRecord | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'OCR' | 'BANK' | 'REGULATORY' | 'AUDIT'>('OVERVIEW');

  // OCR Correction modal state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Clarification reply state
  const [clarificationReply, setClarificationReply] = useState('');

  // Bank verification form state
  const [bankStatus, setBankStatus] = useState<'CONFIRMED' | 'MISMATCH' | 'UNABLE_TO_VERIFY' | 'INFO_REQUIRED'>('CONFIRMED');
  const [bankRef, setBankRef] = useState('');
  const [bankComments, setBankComments] = useState('');

  // Regulatory decision form state
  const [regDecision, setRegDecision] = useState<'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED' | 'FURTHER_VERIFICATION'>('APPROVED');
  const [regReason, setRegReason] = useState('');
  const [regClarificationText, setRegClarificationText] = useState('');

  // Lifecycle modal
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [lifecycleType, setLifecycleType] = useState<'RENEWAL' | 'REPLACEMENT' | 'RELEASE'>('RENEWAL');
  const [lifecycleReason, setLifecycleReason] = useState('');

  useEffect(() => {
    const update = () => {
      if (id) {
        setFdr(FDRService.getFDRById(id));
      }
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [id]);

  if (!fdr) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 text-center my-12 shadow-md space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">FDR Record Not Found</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            The requested reference <span className="font-mono font-semibold text-slate-800">"{id}"</span> was not found in your current active session repository.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/fdr')}
            className="px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition flex items-center gap-2 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Open All Institutional FDRs</span>
          </button>
          <button
            onClick={() => navigate('/fdr/fdr-001')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            View Sample CEG Guindy FDR
          </button>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(fdr.status);
  const daysInfo = getMaturityDaysInfo(fdr.maturityDate);
  const auditLogs = AuditService.getLogs({ entityId: fdr.id });

  // Handle OCR correction submission
  const handleSaveCorrection = () => {
    if (!editingField || !correctionValue.trim() || !correctionReason.trim()) {
      alert('Please provide both the corrected value and an administrative justification.');
      return;
    }
    FDRService.updateOCRField(fdr.id, editingField, correctionValue.trim(), correctionReason.trim());
    setEditingField(null);
    setCorrectionValue('');
    setCorrectionReason('');
  };

  // Handle Bank verification submit
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankRef.trim() || !bankComments.trim()) {
      alert('Bank reference number and official comments are mandatory.');
      return;
    }
    FDRService.submitBankVerification(fdr.id, {
      status: bankStatus,
      referenceNumber: bankRef.trim(),
      comments: bankComments.trim(),
    });
    alert(`Bank Verification recorded as: ${bankStatus}`);
  };

  // Handle Regulatory decision submit
  const handleRegulatorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regReason.trim()) {
      alert('A formal justification reason is mandatory for regulatory decisions.');
      return;
    }
    FDRService.submitRegulatoryDecision(fdr.id, {
      decision: regDecision,
      reason: regReason.trim(),
      clarificationNote: regClarificationText.trim(),
    });
    alert(`Regulatory Decision recorded as: ${regDecision}`);
  };

  // Handle Institution clarification reply
  const handleClarificationReply = () => {
    if (!clarificationReply.trim()) {
      alert('Please enter your response to the regulatory query.');
      return;
    }
    FDRService.respondToClarification(fdr.id, clarificationReply.trim());
    setClarificationReply('');
    alert('Clarification response submitted. Case returned to Regulatory Review queue.');
  };

  // Handle Lifecycle action
  const handleLifecycleSubmit = () => {
    if (!lifecycleReason.trim()) {
      alert('Please provide a reason for the lifecycle request.');
      return;
    }
    const res = FDRService.requestLifecycleAction(fdr.id, lifecycleType, {
      reason: lifecycleReason.trim(),
    });
    setIsLifecycleModalOpen(false);
    setLifecycleReason('');
    if (res.success && res.newFdrId) {
      navigate(`/fdr/${res.newFdrId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back and Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fdr')}
            className="p-1.5 rounded border border-slate-300 hover:bg-white text-slate-700 transition"
            title="Back to registry"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{fdr.fdrNumber}</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
              {fdr.replacementOfFdrId && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                  Replacement of Linked Record
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {fdr.institutionName} &bull; {fdr.bankName} ({fdr.branchName})
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/verify/${fdr.publicVerificationId}`)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-600" />
            <span>Public QR Certificate</span>
          </button>

          {(currentUser.role === 'INSTITUTION' || currentUser.role === 'REGULATORY_OFFICER' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => setIsLifecycleModalOpen(true)}
              className="px-3 py-1.5 bg-gov-navy hover:bg-blue-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Lifecycle Action</span>
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy Alert Banner if discrepancies exist */}
      {fdr.discrepancies.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-md space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Explainable AI Flag: {fdr.discrepancies.length} Discrepancy Requiring Human Review</span>
          </div>
          {fdr.discrepancies.map((d) => (
            <div key={d.id} className="text-xs text-rose-950 bg-white/70 p-2.5 rounded border border-rose-200 space-y-1">
              <div className="font-semibold text-rose-900">{d.title}</div>
              <p className="text-slate-700">{d.explanation}</p>
              <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                <span className="font-medium text-gov-navy">Recommended Action: {d.recommendedAction}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6-Tab Navigation Bar */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'OVERVIEW'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview & Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'DOCUMENTS'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Receipt Documents ({fdr.documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('OCR')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'OCR'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>OCR & Explainable AI</span>
            {fdr.discrepancies.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('BANK')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'BANK'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Bank Verification</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${fdr.bankVerification.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {fdr.bankVerification.status}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REGULATORY')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'REGULATORY'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Regulatory Decision</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap flex items-center gap-1.5 transition ${
              activeTab === 'AUDIT'
                ? 'border-gov-navy text-gov-navy bg-slate-50'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB A: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="p-6 space-y-6">
            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Principal Amount:</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {formatINR(fdr.principalAmount)}
                </p>
                <span className="text-[10px] text-slate-500">Interest: {fdr.interestRate}% p.a.</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Maturity Date:</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {formatDate(fdr.maturityDate)}
                </p>
                <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold border mt-0.5 ${daysInfo.badgeClass}`}>
                  {daysInfo.label}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Issue Date & Tenure:</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(fdr.issueDate)}
                </p>
                <span className="text-[10px] text-slate-500">{fdr.tenureMonths} Months Lock-in</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Deposit Category:</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {fdr.depositCategory.replace('_', ' ')}
                </p>
                <span className="text-[10px] text-slate-500">Statutory Custody</span>
              </div>
            </div>

            {/* Institution & Bank Dual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Institution Details */}
              <div className="p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-gov-navy font-bold">
                  <Building2 className="w-4 h-4" />
                  <span>Authorized Institution</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500">Institution Name:</span>
                    <p className="font-semibold text-slate-900">{fdr.institutionName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Permanent Regulatory ID:</span>
                    <p className="font-mono text-slate-800 font-semibold">{fdr.institutionPermanentId}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Deposit Holder Name:</span>
                    <p className="font-medium text-slate-800">{fdr.holderName}</p>
                  </div>
                  {fdr.jointHolderName && (
                    <div>
                      <span className="text-slate-500">Joint Holder:</span>
                      <p className="font-medium text-slate-800">{fdr.jointHolderName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Statutory Lien In Favor Of:</span>
                    <p className="font-semibold text-slate-900">{fdr.lienMarkedTo}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-gov-navy font-bold">
                  <Landmark className="w-4 h-4" />
                  <span>Issuing Bank & Verification Status</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500">Scheduled Commercial Bank:</span>
                    <p className="font-semibold text-slate-900">{fdr.bankName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Branch Name:</span>
                    <p className="font-medium text-slate-800">{fdr.branchName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Bank Verification Outcome:</span>
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${fdr.bankVerification.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : fdr.bankVerification.status === 'MISMATCH' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                        {fdr.bankVerification.status}
                      </span>
                    </div>
                  </div>
                  {fdr.bankVerification.referenceNumber && (
                    <div>
                      <span className="text-slate-500">CBS Verification Reference:</span>
                      <p className="font-mono text-slate-800 font-medium">{fdr.bankVerification.referenceNumber}</p>
                    </div>
                  )}
                  {fdr.bankVerification.comments && (
                    <div>
                      <span className="text-slate-500">Bank Officer Remarks:</span>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 italic">
                        "{fdr.bankVerification.comments}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clarification Response Section if required */}
            {fdr.status === 'Clarification Required' && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>Regulatory Clarification Requested</span>
                </div>
                <div className="bg-white p-3 rounded border border-amber-200">
                  <span className="text-slate-500 font-semibold">Regulatory Officer Query:</span>
                  <p className="text-slate-900 mt-1 font-medium">
                    {fdr.regulatoryDecision.clarificationComments || fdr.regulatoryDecision.decisionReason}
                  </p>
                </div>

                {currentUser.role === 'INSTITUTION' ? (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800">
                      Submit Institutional Response & Explanation:
                    </label>
                    <textarea
                      rows={3}
                      value={clarificationReply}
                      onChange={(e) => setClarificationReply(e.target.value)}
                      placeholder="Enter formal response detailing bank addendum or correcting discrepancies..."
                      className="w-full p-2.5 border border-slate-300 rounded text-slate-900 bg-white"
                    />
                    <button
                      onClick={handleClarificationReply}
                      className="px-4 py-2 bg-gov-navy text-white font-semibold rounded hover:bg-blue-900 transition"
                    >
                      Submit Response to Regulatory Officer
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-600 italic">
                    Awaiting institutional response from {fdr.institutionName}.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB B: DOCUMENTS */}
        {activeTab === 'DOCUMENTS' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Document Repository & SHA-256 Hashes</h3>
                <p className="text-slate-500 text-[11px]">
                  All deposited receipts are cryptographically hashed upon upload for tamper evidence.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {fdr.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white rounded border border-slate-200 text-gov-navy mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{doc.fileName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Uploaded by <span className="font-medium text-slate-700">{doc.uploadedBy}</span> on {formatDateTime(doc.uploadedAt)} &bull; {(doc.fileSize / 1024).toFixed(1)} KB &bull; Version {doc.version}
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 inline-block break-all">
                        <span className="font-sans font-bold text-slate-500 uppercase text-[9px] mr-1">
                          SHA-256:
                        </span>
                        {doc.sha256Hash}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alert(`Simulated Download: ${doc.fileName}\nSHA-256 Verified: ${doc.sha256Hash}`)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Integrity Proof Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Document Integrity Status: <strong className="font-bold">VERIFIED</strong>. The stored digital artifact matches the SHA-256 hash registered on the immutable ledger.
              </span>
            </div>
          </div>
        )}

        {/* TAB C: OCR & EXPLAINABLE CHECKS */}
        {activeTab === 'OCR' && (
          <div className="p-6 space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-gov-navy" />
                  <span>Explainable AI OCR Field Comparison</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Side-by-side verification between institution submitted data and OCR receipt extraction.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Extraction Confidence:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {fdr.ocrConfidenceAverage}%
                </span>
              </div>
            </div>

            {/* Discrepancies Table / Comparison */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4">Field Parameter</th>
                    <th className="py-2.5 px-4">Submitted Value</th>
                    <th className="py-2.5 px-4">Extracted OCR Value</th>
                    <th className="py-2.5 px-4">Confidence</th>
                    <th className="py-2.5 px-4">Match Status</th>
                    <th className="py-2.5 px-4 text-right">Human Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fdr.extractedFields.map((field) => (
                    <tr key={field.field} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{field.label}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{field.submittedValue}</td>
                      <td className={`py-3 px-4 font-mono font-medium ${!field.isMatched ? 'text-rose-700 font-bold bg-rose-50/50' : 'text-slate-800'}`}>
                        {field.extractedValue}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${field.confidence > 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {field.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {field.isMatched ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingField(field.field);
                            setCorrectionValue(field.extractedValue);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-gov-navy hover:bg-slate-100 rounded border border-slate-300"
                        >
                          <Edit3 className="w-3 h-3 inline mr-1" />
                          Correct Field
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Field Correction Inline Modal */}
            {editingField && (
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3 animate-in fade-in">
                <h4 className="font-bold text-slate-900 text-xs">
                  Correct Extracted Field: <span className="font-mono text-gov-navy">{editingField}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Correct Value:
                    </label>
                    <input
                      type="text"
                      value={correctionValue}
                      onChange={(e) => setCorrectionValue(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Reason / Justification (Logged to Audit):
                    </label>
                    <input
                      type="text"
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="e.g. Scanned receipt watermark caused OCR character error"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveCorrection}
                    className="px-3 py-1.5 bg-gov-navy text-white rounded font-semibold text-xs hover:bg-blue-900"
                  >
                    Save Correction & Log Audit
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded font-semibold text-xs hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB D: BANK VERIFICATION */}
        {activeTab === 'BANK' && (
          <div className="p-6 space-y-6 text-xs">
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-700" />
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  Simulated Bank Verification — Demo Only
                </span>
              </div>
              <span className="text-[11px] text-amber-900">
                Mock bank registry integration for Hackathon demonstration
              </span>
            </div>

            {/* Current Verification Record */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-xs">Bank Verification Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{fdr.bankVerification.status}</p>
                </div>
                <div>
                  <span className="text-slate-500">Assigned Officer:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {fdr.bankVerification.assignedOfficerName || 'Institutional Verification Cell'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">CBS Reference:</span>
                  <p className="font-mono text-slate-800 mt-0.5">
                    {fdr.bankVerification.referenceNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Verification Timestamp:</span>
                  <p className="text-slate-800 mt-0.5">
                    {fdr.bankVerification.verifiedAt ? formatDateTime(fdr.bankVerification.verifiedAt) : 'Pending'}
                  </p>
                </div>
              </div>
              {fdr.bankVerification.comments && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Official Bank Remarks:</span>
                  <p className="text-slate-800 italic mt-0.5">"{fdr.bankVerification.comments}"</p>
                </div>
              )}
            </div>

            {/* Bank Officer Action Form (Shown if Bank Officer or Admin) */}
            {(currentUser.role === 'BANK_OFFICER' || currentUser.role === 'ADMIN') && (
              <form onSubmit={handleBankSubmit} className="p-5 border border-slate-300 rounded-lg bg-white space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-gov-navy" />
                  <span>Record Bank Verification Result (Bank Officer Workspace)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Verification Outcome <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={bankStatus}
                      onChange={(e) => setBankStatus(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-medium"
                    >
                      <option value="CONFIRMED">Confirmed — CBS Ledger Matched & Active</option>
                      <option value="MISMATCH">Mismatch — Financial / Nomenclature Discrepancy</option>
                      <option value="INFO_REQUIRED">Information Required — Additional Endorsement Needed</option>
                      <option value="UNABLE_TO_VERIFY">Unable to Verify — Illegible or Not Found</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank CBS Reference / Token <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      placeholder="e.g. CBS-VERIF-2024-998812"
                      className="w-full p-2 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Officer Comments & Evidence Remarks <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={bankComments}
                      onChange={(e) => setBankComments(e.target.value)}
                      placeholder="Enter core banking remarks and validation details..."
                      className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs transition"
                  >
                    Submit Official Bank Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB E: REGULATORY DECISION */}
        {activeTab === 'REGULATORY' && (
          <div className="p-6 space-y-6 text-xs">
            {/* Current Decision Summary */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-xs">Current Regulatory Determination</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{fdr.regulatoryDecision.status}</p>
                </div>
                <div>
                  <span className="text-slate-500">Authorized Reviewer:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {fdr.regulatoryDecision.reviewerName || 'Regulatory Approvals Bureau'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Decision Date:</span>
                  <p className="text-slate-800 mt-0.5">
                    {fdr.regulatoryDecision.decidedAt ? formatDateTime(fdr.regulatoryDecision.decidedAt) : 'Pending Review'}
                  </p>
                </div>
              </div>
              {fdr.regulatoryDecision.decisionReason && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Official Decision Justification:</span>
                  <p className="text-slate-900 font-medium mt-0.5">
                    "{fdr.regulatoryDecision.decisionReason}"
                  </p>
                </div>
              )}
            </div>

            {/* Regulatory Action Cockpit (Shown if Regulatory Officer or Admin) */}
            {(currentUser.role === 'REGULATORY_OFFICER' || currentUser.role === 'ADMIN') && (
              <form onSubmit={handleRegulatorySubmit} className="p-5 border border-slate-300 rounded-lg bg-white space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gov-navy" />
                  <span>Issue Statutory Regulatory Decision (Authorized Review Cockpit)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Statutory Action <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={regDecision}
                      onChange={(e) => setRegDecision(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-bold"
                    >
                      <option value="APPROVED">Approve — Accept Deposit for Regulatory Lien</option>
                      <option value="REJECTED">Reject — Non-Compliant or Discrepant</option>
                      <option value="CLARIFICATION_REQUIRED">Request Clarification — Issue Query to Institution</option>
                      <option value="FURTHER_VERIFICATION">Further Verification — Refer Back to Bank Desk</option>
                    </select>
                  </div>

                  {regDecision === 'CLARIFICATION_REQUIRED' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Clarification Details for Institution
                      </label>
                      <input
                        type="text"
                        value={regClarificationText}
                        onChange={(e) => setRegClarificationText(e.target.value)}
                        placeholder="Specify required corrections or documents..."
                        className="w-full p-2 border border-slate-300 rounded text-slate-900"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mandatory Decision Reason & Justification <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={regReason}
                      onChange={(e) => setRegReason(e.target.value)}
                      placeholder="Enter legal and statutory reasons supporting this decision..."
                      className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gov-navy hover:bg-blue-900 text-white font-bold rounded shadow-xs transition"
                  >
                    Confirm & Record Statutory Decision
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB F: AUDIT TIMELINE */}
        {activeTab === 'AUDIT' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Case Audit Trail & Event Timeline</h3>
                <p className="text-slate-500 text-[11px]">
                  Tamper-evident log of all transitions, corrections, and approvals recorded for this case.
                </p>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-gov-navy ring-4 ring-white"></div>
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Actor: <strong className="text-slate-800">{log.actorName}</strong> ({log.actorRole})
                    </div>
                    {log.previousState && log.newState && (
                      <div className="text-[11px] font-mono text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                        {log.previousState} &rarr; <span className="font-bold text-gov-navy">{log.newState}</span>
                      </div>
                    )}
                    {log.reason && (
                      <p className="text-slate-700 italic pt-1">{log.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Action Modal */}
      {isLifecycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Initiate Lifecycle Action</h3>
            <p className="text-xs text-slate-500">
              Select lifecycle transition for Fixed Deposit Receipt {fdr.fdrNumber}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Type:</label>
                <select
                  value={lifecycleType}
                  onChange={(e) => setLifecycleType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
                >
                  <option value="RENEWAL">Renewal (Extend Tenure upon Maturity)</option>
                  <option value="REPLACEMENT">Replacement (Substitute with New Certificate)</option>
                  <option value="RELEASE">Release (Close Deposit upon Statutory Discharge)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason & Administrative Justification:
                </label>
                <textarea
                  rows={3}
                  value={lifecycleReason}
                  onChange={(e) => setLifecycleReason(e.target.value)}
                  placeholder="State the institutional justification..."
                  className="w-full p-2.5 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsLifecycleModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded font-semibold text-xs hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLifecycleSubmit}
                className="px-4 py-2 bg-gov-navy text-white rounded font-semibold text-xs hover:bg-blue-900"
              >
                Confirm Lifecycle Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
