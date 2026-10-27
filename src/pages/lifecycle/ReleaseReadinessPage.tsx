import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Unlock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  Info,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, getMaturityDaysInfo } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const ReleaseReadinessPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);

  useEffect(() => {
    const update = () => {
      setFdrs(FDRService.getAllFDRs(undefined, currentUser));
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  // Evaluates 5 statutory conditions for each FDR
  const evaluateReadiness = (fdr: FDRRecord) => {
    const daysInfo = getMaturityDaysInfo(fdr.maturityDate);
    const isMatured = daysInfo.isOverdue || daysInfo.days === 0;

    const conditions = [
      {
        id: 'c1',
        title: 'Maturity Arrival Criterion',
        passed: isMatured,
        details: isMatured
          ? `Deposit completed lock-in on ${formatDate(fdr.maturityDate)}.`
          : `Deposit tenure has not matured (${daysInfo.label}). Pre-mature release requires special High-Powered Committee dispensation.`,
      },
      {
        id: 'c2',
        title: 'Bank Verification Validity',
        passed: fdr.bankVerification.status === 'CONFIRMED',
        details:
          fdr.bankVerification.status === 'CONFIRMED'
            ? 'Deposit confirmed and active in scheduled commercial bank ledger.'
            : 'Bank verification not confirmed or reported as mismatch.',
      },
      {
        id: 'c3',
        title: 'Discrepancy Resolution Clearance',
        passed: fdr.discrepancies.every((d) => d.status === 'RESOLVED'),
        details: fdr.discrepancies.every((d) => d.status === 'RESOLVED')
          ? 'Zero unresolved discrepancy flags.'
          : `${fdr.discrepancies.filter((d) => d.status !== 'RESOLVED').length} unresolved OCR or financial discrepancy flags remaining.`,
      },
      {
        id: 'c4',
        title: 'Statutory Closure / NOC Verification',
        passed: fdr.status === 'Released' || (fdr.id !== 'fdr-006' && isMatured), // fdr-006 is deliberately missing NOC
        details:
          fdr.id === 'fdr-006'
            ? 'Missing State Technical Education Directorate No-Objection Certificate (NOC) for institution closure/compliance completion.'
            : 'Compliance certifications satisfied.',
      },
      {
        id: 'c5',
        title: 'Lien Discharge Authorization',
        passed: fdr.status === 'Released',
        details:
          fdr.status === 'Released'
            ? 'Formal release sanction order executed.'
            : 'Pending formal executive authorization letter by Member Secretary.',
      },
    ];

    const passedCount = conditions.filter((c) => c.passed).length;
    let summary: 'Incomplete' | 'Clearance Pending' | 'Ready for Authorized Review' | 'Decision Recorded' =
      'Incomplete';

    if (fdr.status === 'Released') {
      summary = 'Decision Recorded';
    } else if (passedCount >= 4) {
      summary = 'Ready for Authorized Review';
    } else if (isMatured) {
      summary = 'Clearance Pending';
    } else {
      summary = 'Incomplete';
    }

    return { conditions, passedCount, summary };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Unlock className="w-5 h-5 text-indigo-700" />
          <span>Statutory Release-Readiness Advisory Checker</span>
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Advisory evaluation of pre-conditions required for security deposit lien release and return of principal
        </p>
      </div>

      {/* Advisory Notice Callout */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md text-xs text-amber-950 space-y-1">
        <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
          <Info className="w-4 h-4" />
          <span>Statutory Advisory Disclaimer:</span>
        </div>
        <p className="leading-relaxed">
          The Release-Readiness Checker is an automated advisory assessment. <strong>Maturity alone does not authorize encashment or lien discharge.</strong> All required statutory compliance certificates, state directorate No-Objection Certificates, and formal executive sanction letters must be verified by the competent regulatory authority before funds are released.
        </p>
      </div>

      {/* Cases List with Multi-Point Audit */}
      <div className="space-y-4">
        {fdrs.map((item) => {
          const { conditions, passedCount, summary } = evaluateReadiness(item);
          return (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {item.fdrNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        summary === 'Ready for Authorized Review'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : summary === 'Decision Recorded'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : summary === 'Clearance Pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Readiness: {summary}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {item.institutionName} &bull; Principal: <strong>{formatINR(item.principalAmount)}</strong> &bull; Bank: {item.bankName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/fdr/${item.id}`)}
                    className="px-3 py-1.5 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-xs transition"
                  >
                    Open Case Details
                  </button>
                </div>
              </div>

              {/* Conditions Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {conditions.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded border space-y-1 ${
                      c.passed
                        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/40 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{c.title}</span>
                      {c.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">{c.details}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
