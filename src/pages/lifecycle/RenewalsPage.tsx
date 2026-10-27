import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FileText,
  Building2,
  Landmark,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  History,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, getStatusBadge } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const RenewalsPage: React.FC<Props> = ({ currentUser }) => {
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

  // Filter FDRs that are in Renewal Pending, Replacement Pending, or have replacements
  const lifecycleCases = fdrs.filter(
    (f) =>
      f.status === 'Renewal Pending' ||
      f.status === 'Replacement Pending' ||
      f.renewalCount > 0 ||
      f.replacementOfFdrId ||
      f.replacedByFdrId
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-700" />
            <span>FDR Renewal & Replacement Registry</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Track certificate rollovers, renewals upon maturity, and replacement chains preserving historical audit logs
          </p>
        </div>

        <button
          onClick={() => navigate('/fdr')}
          className="px-3 py-1.5 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-xs transition"
        >
          View All Active Cases
        </button>
      </div>

      {/* Info card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-950 flex items-start gap-3">
        <History className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Replacement Versioning Rule:</strong> When an FDR is replaced due to bank restructuring or tenure rollover, the system creates a linked new record while preserving the original certificate scans, verification timestamps, and regulatory decisions in an immutable parent-child relationship.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span className="uppercase tracking-wide">
            Active Renewal & Replacement Records ({lifecycleCases.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">FDR No.</th>
                <th className="py-2.5 px-4">Relationship / Type</th>
                <th className="py-2.5 px-4">Institution Name</th>
                <th className="py-2.5 px-4">Bank & Branch</th>
                <th className="py-2.5 px-4">Principal (INR)</th>
                <th className="py-2.5 px-4">Maturity Date</th>
                <th className="py-2.5 px-4">Current Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lifecycleCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No FDR cases currently have pending renewal or replacement transactions.
                  </td>
                </tr>
              ) : (
                lifecycleCases.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.fdrNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.replacementOfFdrId ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                            Replacement of Linked Case
                          </span>
                        ) : item.status === 'Renewal Pending' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Renewal Extension
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            Rollover v{item.renewalCount + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-[180px]">
                        {item.institutionName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.bankName}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatINR(item.principalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{formatDate(item.maturityDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/fdr/${item.id}`)}
                          className="px-2.5 py-1 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-[11px] transition"
                        >
                          View Chain
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
