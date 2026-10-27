import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  RefreshCw,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Landmark,
  Eye,
  Info,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, getMaturityDaysInfo } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const MaturityCalendarPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<'ALL' | '7_DAYS' | '15_DAYS' | '30_DAYS' | 'OVERDUE'>('ALL');

  useEffect(() => {
    const update = () => {
      setFdrs(FDRService.getAllFDRs(undefined, currentUser));
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  // Cohort breakdowns
  const overdueCases = fdrs.filter((f) => getMaturityDaysInfo(f.maturityDate).isOverdue);
  const cohort7Days = fdrs.filter((f) => {
    const info = getMaturityDaysInfo(f.maturityDate);
    return !info.isOverdue && info.days <= 7;
  });
  const cohort15Days = fdrs.filter((f) => {
    const info = getMaturityDaysInfo(f.maturityDate);
    return !info.isOverdue && info.days > 7 && info.days <= 15;
  });
  const cohort30Days = fdrs.filter((f) => {
    const info = getMaturityDaysInfo(f.maturityDate);
    return !info.isOverdue && info.days > 15 && info.days <= 30;
  });

  const getFilteredCases = () => {
    switch (selectedCohort) {
      case 'OVERDUE':
        return overdueCases;
      case '7_DAYS':
        return cohort7Days;
      case '15_DAYS':
        return cohort15Days;
      case '30_DAYS':
        return cohort30Days;
      case 'ALL':
      default:
        return fdrs;
    }
  };

  const displayedList = getFilteredCases();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gov-navy" />
            <span>Maturity Horizon & Lifecycle Management</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Monitor approaching deposit maturity milestones, overdue certificates, and renewal deadlines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/lifecycle/renewals')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gov-navy" />
            <span>Renewal & Replacement Queue</span>
          </button>
        </div>
      </div>

      {/* Backend Scheduled Notification Disclaimer */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r text-xs text-blue-950 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong>Automated Lifecycle Alert Notice:</strong> Maturity notifications displayed in this portal are computed from registered maturity dates. Automated outbound email/SMS delivery is executed by backend background cron tasks; ensure your institution contact credentials are kept up to date.
        </div>
      </div>

      {/* Cohort Metric Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <button
          onClick={() => setSelectedCohort('ALL')}
          className={`p-3 rounded-lg border text-left transition ${
            selectedCohort === 'ALL'
              ? 'border-gov-navy bg-gov-navy text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">All Deposits</div>
          <div className="text-xl font-bold mt-1">{fdrs.length}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Complete Portfolio</div>
        </button>

        <button
          onClick={() => setSelectedCohort('OVERDUE')}
          className={`p-3 rounded-lg border text-left transition ${
            selectedCohort === 'OVERDUE'
              ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">Matured / Overdue</div>
          <div className="text-xl font-bold mt-1 text-rose-600 group-hover:text-rose-700">
            {overdueCases.length}
          </div>
          <div className="text-[10px] mt-0.5 text-rose-700 opacity-90">Renewal or Release Required</div>
        </button>

        <button
          onClick={() => setSelectedCohort('7_DAYS')}
          className={`p-3 rounded-lg border text-left transition ${
            selectedCohort === '7_DAYS'
              ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">7-Day Window</div>
          <div className="text-xl font-bold mt-1 text-amber-700">{cohort7Days.length}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Immediate Attention</div>
        </button>

        <button
          onClick={() => setSelectedCohort('15_DAYS')}
          className={`p-3 rounded-lg border text-left transition ${
            selectedCohort === '15_DAYS'
              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">15-Day Window</div>
          <div className="text-xl font-bold mt-1 text-blue-700">{cohort15Days.length}</div>
          <div className="text-[10px] mt-0.5 opacity-80">First Notice Period</div>
        </button>

        <button
          onClick={() => setSelectedCohort('30_DAYS')}
          className={`p-3 rounded-lg border text-left transition ${
            selectedCohort === '30_DAYS'
              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-[11px] opacity-80 uppercase tracking-wider">30-Day Window</div>
          <div className="text-xl font-bold mt-1 text-purple-700">{cohort30Days.length}</div>
          <div className="text-[10px] mt-0.5 opacity-80">Early Advance Notice</div>
        </button>
      </div>

      {/* Cohort Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span className="uppercase tracking-wide">
            Deposit Maturity Schedule: {selectedCohort.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            {displayedList.length} records in this view
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">FDR Certificate No.</th>
                <th className="py-2.5 px-4">Institution Name</th>
                <th className="py-2.5 px-4">Bank & Branch</th>
                <th className="py-2.5 px-4">Principal Amount</th>
                <th className="py-2.5 px-4">Maturity Date</th>
                <th className="py-2.5 px-4">Timeline Status</th>
                <th className="py-2.5 px-4">Current Workflow</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No deposit records currently fall into this maturity cohort.
                  </td>
                </tr>
              ) : (
                displayedList.map((item) => {
                  const daysInfo = getMaturityDaysInfo(item.maturityDate);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.fdrNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-[200px]">
                        {item.institutionName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.bankName}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatINR(item.principalAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {formatDate(item.maturityDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${daysInfo.badgeClass}`}>
                          {daysInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{item.status}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/fdr/${item.id}`)}
                          className="px-2.5 py-1 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-[11px] transition"
                        >
                          Lifecycle Action
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
