import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  RotateCcw,
  User,
  Calendar,
} from 'lucide-react';
import { AuditLogEntry, UserRole } from '../../types';
import { AuditService } from '../../services/audit.service';
import { subscribeToStorage } from '../../lib/storage';
import { formatDateTime } from '../../lib/utils';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterEntityType, setFilterEntityType] = useState<string>('ALL');
  const [searchEntityId, setSearchEntityId] = useState<string>('');
  const [searchActor, setSearchActor] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setLogs(AuditService.getLogs());
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterRole !== 'ALL' && l.actorRole !== filterRole) return false;
    if (filterEntityType !== 'ALL' && l.entityType !== filterEntityType) return false;
    if (searchEntityId && !l.entityId.toLowerCase().includes(searchEntityId.toLowerCase()))
      return false;
    if (searchActor && !l.actorName.toLowerCase().includes(searchActor.toLowerCase()))
      return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Actor Name',
      'Role',
      'Action Code',
      'Entity Type',
      'Entity ID',
      'Previous State',
      'New State',
      'Reason',
      'IP Address',
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${l.previousState || ''}"`,
      `"${l.newState || ''}"`,
      `"${l.reason || ''}"`,
      `"${l.ipAddress || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `FDR_Guardian_System_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gov-navy" />
            <span>Immutable System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Cryptographically sealed operational audit events for all verification decisions, OCR field changes, and status transitions
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Actor Role:</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="ALL">All Roles</option>
              <option value="INSTITUTION">Institution User</option>
              <option value="BANK_OFFICER">Bank Officer</option>
              <option value="REGULATORY_OFFICER">Regulatory Officer</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Entity Type:</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="ALL">All Entities</option>
              <option value="FDR">FDR Case Record</option>
              <option value="DOCUMENT">Document Artifact</option>
              <option value="INSTITUTION">Institution Master</option>
              <option value="USER">User Account</option>
              <option value="RECONCILIATION">Reconciliation Batch</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Search Entity ID:</label>
            <input
              type="text"
              value={searchEntityId}
              onChange={(e) => setSearchEntityId(e.target.value)}
              placeholder="e.g. fdr-001 or fdr-2024"
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Search Actor Name:</label>
            <input
              type="text"
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              placeholder="e.g. Meenakshi or Rajesh"
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-slate-500">
            Total Audit Records: <strong className="text-slate-800">{filteredLogs.length}</strong>
          </span>
          <button
            onClick={() => {
              setFilterRole('ALL');
              setFilterEntityType('ALL');
              setSearchEntityId('');
              setSearchActor('');
            }}
            className="text-gov-navy hover:underline font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Action Code</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">State Transition</th>
                <th className="py-2.5 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{log.actorName}</td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-gov-navy text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className="text-[10px] font-sans uppercase font-bold text-slate-500 mr-1">
                      {log.entityType}:
                    </span>
                    {log.entityId}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {log.previousState && log.newState ? (
                      <span className="text-slate-600">
                        {log.previousState} &rarr;{' '}
                        <strong className="text-slate-900">{log.newState}</strong>
                      </span>
                    ) : log.newState ? (
                      <strong className="text-slate-900">{log.newState}</strong>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-[280px] truncate" title={log.reason}>
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
