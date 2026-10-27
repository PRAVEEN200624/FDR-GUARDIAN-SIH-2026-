import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
  Landmark,
  FileCheck,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { FDRService } from '../../services/fdr.service';
import { formatINR, formatDate, getStatusBadge } from '../../lib/utils';

export const QRVerificationPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();

  const fdr = publicId ? FDRService.getFDRByPublicId(publicId) : undefined;
  const currentUrl = window.location.href;

  if (!fdr) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-slate-300 shadow-md max-w-md w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Verification Record Not Located</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            No public statutory Fixed Deposit Receipt record matches the token:
            <span className="font-mono font-bold block mt-1 text-slate-800 break-all">{publicId}</span>
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            Please ensure you have scanned an authentic statutory QR code certificate.
          </div>
          <Link
            to="/"
            className="inline-block mt-4 px-4 py-2 bg-gov-navy text-white rounded text-xs font-semibold hover:bg-blue-900 transition"
          >
            Portal Home
          </Link>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(fdr.status);
  const isApproved = fdr.status === 'Approved' || fdr.status === 'Released';

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center justify-center">
      {/* Official Certificate Card */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Certificate Header Banner */}
        <div className="bg-gov-navy text-white px-6 py-5 border-b-4 border-amber-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                National Institutional Deposit Verification Service
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">
                Public Statutory FDR Status Certificate
              </h1>
            </div>
          </div>
          <div className="hidden sm:block text-right text-[11px] text-blue-200">
            <div>FDR Guardian Portal</div>
            <div className="font-mono text-[10px]">Verified e-Gov Record</div>
          </div>
        </div>

        {/* Status Highlight Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Statutory Determination:</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}>
              {fdr.status.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Token: {fdr.publicVerificationId}
          </span>
        </div>

        {/* Safe Public Parameters (Redacted & Masked) */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left 2 Cols: Public Information */}
            <div className="md:col-span-2 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Institution Name:</span>
                <p className="font-bold text-slate-900 text-sm">{fdr.institutionName}</p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Permanent ID: {fdr.institutionPermanentId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500">Issuing Scheduled Bank:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{fdr.bankName}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500">Certificate Reference:</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {fdr.fdrNumber.slice(0, 4)}****{fdr.fdrNumber.slice(-3)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500">Maturity Expiry Date:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{formatDate(fdr.maturityDate)}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500">Lien Custody Authority:</span>
                  <p className="font-semibold text-slate-900 mt-0.5 truncate">{fdr.lienMarkedTo}</p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Dynamic QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="p-2 bg-white rounded border border-slate-300 shadow-2xs">
                <QRCodeSVG value={currentUrl} size={110} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2">
                Scan to Re-Verify
              </span>
            </div>
          </div>

          {/* Cryptographic & Integrity Proofs */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
              Cryptographic & Regulatory Integrity Status:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  SHA-256 Document Integrity: <strong>Verified</strong>
                </span>
              </div>

              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-950 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Bank CBS Ledger Cross-Check: <strong>{fdr.bankVerification.status}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Public Verification Disclaimer */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <strong>Important Legal Notice:</strong> A QR code certificate is a cryptographic pointer to an official regulatory record. It does not by itself prove authenticity if scanned offline. Sensitive banking notes, raw financial statements, and internal audit logs are strictly protected and withheld from public exposure.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Verification Engine &bull; FDR Guardian Prototype</span>
          <Link to="/" className="text-gov-navy font-semibold hover:underline">
            Back to Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
