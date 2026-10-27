import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Landmark,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage, getStoredInstitutions, getStoredBanks } from '../../lib/storage';
import { formatINR } from '../../lib/utils';
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
  Legend,
} from 'recharts';

interface Props {
  currentUser: User;
}

export const ReportsPage: React.FC<Props> = ({ currentUser }) => {
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);

  useEffect(() => {
    const update = () => {
      setFdrs(FDRService.getAllFDRs(undefined, currentUser));
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  // Aggregate Status Distribution
  const statusCounts: Record<string, number> = {};
  const statusAmounts: Record<string, number> = {};
  fdrs.forEach((f) => {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
    statusAmounts[f.status] = (statusAmounts[f.status] || 0) + f.principalAmount;
  });

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const barDataAmount = Object.entries(statusAmounts).map(([name, amount]) => ({
    status: name,
    amountLakhs: Number((amount / 100000).toFixed(1)), // In Lakhs
  }));

  // Bank Verification Outcomes
  const bankOutcomes: Record<string, number> = {};
  fdrs.forEach((f) => {
    const st = f.bankVerification.status;
    bankOutcomes[st] = (bankOutcomes[st] || 0) + 1;
  });
  const bankChartData = Object.entries(bankOutcomes).map(([name, count]) => ({
    outcome: name,
    count,
  }));

  // Institution-wise Distribution
  const instCounts: Record<string, number> = {};
  fdrs.forEach((f) => {
    instCounts[f.institutionName] = (instCounts[f.institutionName] || 0) + 1;
  });
  const instChartData = Object.entries(instCounts).map(([name, count]) => ({
    institution: name.length > 20 ? name.slice(0, 18) + '...' : name,
    count,
  }));

  const COLORS = ['#15803d', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0284c7', '#64748b'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gov-navy" />
            <span>Operational Reports & Statutory Analytics</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Aggregated metrics derived from active database records and institutional deposit schedules
          </p>
        </div>
      </div>

      {/* Top 2 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              FDR Workflow Status Distribution
            </h3>
            <p className="text-[11px] text-slate-500">Breakdown across all active cases</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deposit Volume in Lakhs */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Principal Deposit Volume by Status (₹ Lakhs)
            </h3>
            <p className="text-[11px] text-slate-500">Statutory funds held in escrow per status</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barDataAmount} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="status"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`₹${val} Lakhs`, 'Principal Volume']}
                  contentStyle={{ fontSize: '11px', borderRadius: '4px' }}
                />
                <Bar dataKey="amountLakhs" fill="#0c2340" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 2 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Verification Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Bank Verification Outcomes
            </h3>
            <p className="text-[11px] text-slate-500">Core Banking CBS cross-check outcomes</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="outcome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                <Bar dataKey="count" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Institution Concentration */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              FDR Count by Institution
            </h3>
            <p className="text-[11px] text-slate-500">Distribution across registered institutions</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={instChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="institution"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
