import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const EscalationPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [filterStage, setFilterStage] = useState('ALL');
  const [filterBreachedOnly, setFilterBreachedOnly] = useState(false);

  useEffect(() => {
    const update = () => {
      setFdrs(FDRService.getAllFDRs(undefined, currentUser));
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  // Compute SLA aging for each FDR
  const casesWithAging = fdrs.map((item) => {
    const enteredDate = new Date(item.stageEnteredAt || item.updatedAt);
    const now = new Date();
    const diffHours = Math.max(0, (now.getTime() - enteredDate.getTime()) / (1000 * 60 * 60));
    const daysInStage = Math.floor(diffHours / 24);
    const slaTarget = item.serviceTargetDays || 5;
    const isBreached = daysInStage > slaTarget;
    const isWarning = daysInStage >= slaTarget - 1 && !isBreached;

    let assignedTeam = 'Administrative Desk';
    if (item.status.includes('Bank')) assignedTeam = 'Bank Verification Desk';
    if (item.status.includes('Regulatory') || item.status === 'Clarification Required')
      assignedTeam = 'Regulatory Review Bureau';
    if (item.status.includes('Release')) assignedTeam = 'Legal & Discharge Cell';

    let recommendedAction = 'Expedite pending verification';
    if (item.status === 'Clarification Required')
      recommendedAction = 'Send reminder letter to Institution Registrar';
    if (item.status === 'Bank Mismatch')
      recommendedAction = 'Request branch manager clarification on financial variance';
    if (item.status === 'Release Pending')
      recommendedAction = 'Verify State Directorate closure NOC document';

    return {
      ...item,
      daysInStage,
      slaTarget,
      isBreached,
      isWarning,
      assignedTeam,
      recommendedAction,
    };
  });

  const filteredCases = casesWithAging.filter((c) => {
    if (filterBreachedOnly && !c.isBreached) return false;
    if (filterStage !== 'ALL' && c.status !== filterStage) return false;
    return true;
  });

  const totalBreached = casesWithAging.filter((c) => c.isBreached).length;
  const totalWarning = casesWithAging.filter((c) => c.isWarning).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <span>Smart Pending-Case Monitoring & Escalations</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time SLA tracking based on stage entry timestamps and statutory service targets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {totalBreached} SLA Breaches
          </div>
          <div className="px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            {totalWarning} Nearing Target
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Workflow Stage:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="ALL">All Stages</option>
              <option value="Bank Verification Pending">Bank Verification Pending</option>
              <option value="Bank Mismatch">Bank Mismatch</option>
              <option value="Under Regulatory Review">Under Regulatory Review</option>
              <option value="Clarification Required">Clarification Required</option>
              <option value="Release Pending">Release Pending</option>
              <option value="Renewal Pending">Renewal Pending</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterBreachedOnly}
              onChange={(e) => setFilterBreachedOnly(e.target.checked)}
              className="rounded text-rose-600 border-slate-300"
            />
            <span>Show Breached SLAs Only</span>
          </label>
        </div>

        <button
          onClick={() => {
            setFilterStage('ALL');
            setFilterBreachedOnly(false);
          }}
          className="text-gov-navy hover:underline font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Case / FDR No.</th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Assigned Bureau</th>
                <th className="py-3 px-4">Stage Duration</th>
                <th className="py-3 px-4">SLA Target</th>
                <th className="py-3 px-4">Delay Reason</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No cases match the selected escalation criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 transition ${
                      c.isBreached ? 'bg-rose-50/30' : c.isWarning ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {c.fdrNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium truncate max-w-[180px]">
                      {c.institutionName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.assignedTeam}</td>
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={`${
                          c.isBreached
                            ? 'text-rose-700 font-extrabold'
                            : c.isWarning
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {c.daysInStage} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{c.slaTarget} Days max</td>
                    <td className="py-3.5 px-4 text-slate-700 italic max-w-[160px] truncate">
                      {c.delayReason || 'Normal operational queue processing'}
                    </td>
                    <td className="py-3.5 px-4 text-gov-navy font-medium max-w-[180px]">
                      {c.recommendedAction}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/fdr/${c.id}`)}
                        className="px-2.5 py-1 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-[11px] transition"
                      >
                        Escalate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
