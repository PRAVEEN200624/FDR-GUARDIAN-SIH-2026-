import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  Landmark,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  PlusCircle,
  HelpCircle,
  Unlock,
  RefreshCw,
  Users,
} from 'lucide-react';
import { User, FDRRecord } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { getStoredInstitutions, getStoredUsers, subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, getStatusBadge, getMaturityDaysInfo } from '../../lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface Props {
  currentUser: User;
}

export const DashboardPage: React.FC<Props> = ({ currentUser }) => {
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

  // Derived metrics
  const totalFDRs = fdrs.length;
  const totalPrincipal = fdrs.reduce((acc, curr) => acc + curr.principalAmount, 0);

  const awaitingBank = fdrs.filter(
    (f) =>
      f.status === 'Bank Verification Pending' || f.status === 'Ready for Bank Verification'
  ).length;

  const awaitingRegulatory = fdrs.filter(
    (f) => f.status === 'Under Regulatory Review'
  ).length;

  const approvedCount = fdrs.filter((f) => f.status === 'Approved').length;

  const clarificationCount = fdrs.filter(
    (f) =>
      f.status === 'Clarification Required' ||
      f.status === 'Correction Required' ||
      f.status === 'Bank Mismatch'
  ).length;

  const upcomingMaturities = fdrs.filter((f) => {
    const daysInfo = getMaturityDaysInfo(f.maturityDate);
    return daysInfo.days <= 30 && !daysInfo.isOverdue;
  });

  const overdueMaturities = fdrs.filter((f) => {
    const daysInfo = getMaturityDaysInfo(f.maturityDate);
    return daysInfo.isOverdue;
  });

  const releasePendingCount = fdrs.filter((f) => f.status === 'Release Pending').length;

  // Chart Data: Status Distribution
  const statusCounts: Record<string, number> = {};
  fdrs.forEach((f) => {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  });

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#15803d', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0284c7', '#64748b'];

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto">
      {/* Top Banner / Role Welcome */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {currentUser.role === 'INSTITUTION' && 'Institution FDR Portfolio Dashboard'}
              {currentUser.role === 'BANK_OFFICER' && 'Bank Verification Desk'}
              {currentUser.role === 'REGULATORY_OFFICER' && 'Regulatory Review & Approvals Cockpit'}
              {currentUser.role === 'ADMIN' && 'System Administration & Operational Monitor'}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{currentUser.name}</span> &bull;{' '}
            {currentUser.institutionName || currentUser.bankName || 'Government Administrative Mission'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'INSTITUTION' && (
            <button
              onClick={() => navigate('/fdr/submit')}
              className="px-4 py-2 bg-gov-navy hover:bg-blue-900 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Submit New FDR</span>
            </button>
          )}

          {currentUser.role === 'BANK_OFFICER' && (
            <button
              onClick={() => navigate('/bank/verify')}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <Landmark className="w-4 h-4 text-emerald-300" />
              <span>Open Verification Queue</span>
            </button>
          )}

          {currentUser.role === 'REGULATORY_OFFICER' && (
            <button
              onClick={() => navigate('/regulatory/review')}
              className="px-4 py-2 bg-gov-navy hover:bg-blue-900 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Review Pending Decisions ({awaitingRegulatory})</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total FDRs */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deposits</span>
            <FileText className="w-4 h-4 text-gov-navy" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalFDRs}</div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium">
            Total Value: <span className="font-bold text-slate-800">{formatINR(totalPrincipal)}</span>
          </div>
        </div>

        {/* Card 2: Awaiting Bank Verification */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Bank Verification</span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{awaitingBank}</div>
          <div className="text-[11px] text-slate-600 mt-1">Pending CBS ledger validation</div>
        </div>

        {/* Card 3: Regulatory Review */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Regulatory Decision</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">{awaitingRegulatory}</div>
          <div className="text-[11px] text-slate-600 mt-1">Ready for approval or clarification</div>
        </div>

        {/* Card 4: Approved / Active */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Statutory Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2">{approvedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Lien marked & verified</div>
        </div>
      </div>

      {/* Action Banners for Alerts / Clarifications */}
      {clarificationCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Action Required: {clarificationCount} Case(s) with Discrepancies or Clarifications
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                Certain FDR receipts have mismatching parameters, OCR confidence warnings, or official queries awaiting response.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/fdr?status=Clarification Required')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium shrink-0 transition"
          >
            Review Discrepancies
          </button>
        </div>
      )}

      {/* Middle Grid: Charts and Upcoming Maturity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Status Distribution Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Portfolio Status Breakdown
            </h3>
            <span className="text-[11px] text-slate-600 font-medium">{totalFDRs} records</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center py-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '11px', borderRadius: '4px', borderColor: '#cbd5e1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-600">No chart data available</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-3">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{entry.name}:</span>
                <span className="font-bold text-slate-800">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center & Right: Upcoming Maturity Schedule */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Upcoming Maturities & Lifecycle Alerts (30-Day Window)
              </h3>
            </div>
            <button
              onClick={() => navigate('/lifecycle/maturity')}
              className="text-xs text-gov-navy hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Full Calendar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto mt-3">
            {upcomingMaturities.length === 0 && overdueMaturities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-600">
                No active deposits maturing within the next 30 days.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">FDR Number</th>
                    <th className="py-2 px-3">Institution</th>
                    <th className="py-2 px-3">Bank</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Maturity Date</th>
                    <th className="py-2 px-3">Timeline</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...overdueMaturities, ...upcomingMaturities].map((item) => {
                    const daysInfo = getMaturityDaysInfo(item.maturityDate);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                          {item.fdrNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 truncate max-w-[150px]">
                          {item.institutionName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.bankName}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {formatINR(item.principalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{formatDate(item.maturityDate)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${daysInfo.badgeClass}`}>
                            {daysInfo.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => navigate(`/fdr/${item.id}`)}
                            className="text-[11px] font-semibold text-gov-navy hover:underline"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Submissions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Recent FDR Case Submissions
            </h3>
            <p className="text-[11px] text-slate-600">
              Latest statutory Fixed Deposit Receipts entered into the verification workflow
            </p>
          </div>
          <button
            onClick={() => navigate('/fdr')}
            className="text-xs text-gov-navy hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All FDRs ({totalFDRs})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">FDR No.</th>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3">Bank & Branch</th>
                <th className="py-2.5 px-3">Principal (INR)</th>
                <th className="py-2.5 px-3">Maturity</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3">Bank Check</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fdrs.slice(0, 5).map((f) => {
                const badge = getStatusBadge(f.status);
                return (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {f.fdrNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1 max-w-[200px]">
                        {f.institutionName}
                      </div>
                      <div className="text-[10px] text-slate-600">{f.institutionPermanentId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800">{f.bankName}</div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[140px]">
                        {f.branchName}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {formatINR(f.principalAmount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(f.maturityDate)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          f.bankVerification.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.bankVerification.status === 'MISMATCH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {f.bankVerification.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/fdr/${f.id}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-gov-navy hover:text-white text-slate-700 font-semibold rounded text-[11px] border border-slate-300 transition"
                      >
                        View Case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
