import React, { useState, useEffect } from 'react';
import {
  Layers,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Info,
  RotateCcw,
} from 'lucide-react';
import { User, ReconciliationBatch } from '../../types';
import { ReconciliationService } from '../../services/reconciliation.service';
import { formatINR } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const ReconciliationPage: React.FC<Props> = ({ currentUser }) => {
  const [batches, setBatches] = useState<ReconciliationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ReconciliationBatch | null>(null);

  // Resolution modal state
  const [resolvingRecordId, setResolvingRecordId] = useState<string | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');

  // CSV Drag and drop state
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string>('');

  useEffect(() => {
    const list = ReconciliationService.getBatches();
    setBatches(list);
    if (list.length > 0) {
      setSelectedBatch(list[0]);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv format schedule file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      setCsvFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleRunReconciliation = () => {
    if (!csvContent || !csvFileName) {
      alert('Please select a CSV schedule to reconcile.');
      return;
    }
    const batch = ReconciliationService.reconcileCSV(csvFileName, csvContent, currentUser.institutionId);
    const updated = ReconciliationService.getBatches();
    setBatches(updated);
    setSelectedBatch(batch);
    setCsvContent('');
    setCsvFileName('');
    alert(`Reconciliation analysis completed! Processed ${batch.totalRecords} records.`);
  };

  const handleResolveFlag = () => {
    if (!selectedBatch || !resolvingRecordId || !resolutionReason.trim()) {
      alert('Please enter a formal resolution justification.');
      return;
    }
    ReconciliationService.resolveFlag(selectedBatch.id, resolvingRecordId, resolutionReason.trim());
    const updated = ReconciliationService.getBatches();
    setBatches(updated);
    const refreshed = updated.find((b) => b.id === selectedBatch.id) || null;
    setSelectedBatch(refreshed);
    setResolvingRecordId(null);
    setResolutionReason('');
    alert('Reconciliation flag resolved and recorded.');
  };

  // Sample CSV generator for easy testing
  const handleLoadSampleCSV = () => {
    const sample = `FDR Number,Bank Name,Reported Amount,Maturity Date,Institution Name
SBI-CEG-2024-FDR-984210,State Bank of India,3500000,2029-06-15,College of Engineering, Guindy (Anna University)
FDR-2024-9102,State Bank of India,5000000,2029-02-10,R.M.K. Engineering College (RMKEC)
FDR-2024-6620,Canara Bank,3000000,2029-03-10,College of Engineering, Guindy (Anna University)
FDR-2022-9988,Bank of India,1800000,2027-08-20,Varanasi Institute of Pharmaceutical Sciences
FDR-2024-4321,Punjab National Bank,2500000,2027-01-05,Aryabhata National Polytechnic`;

    setCsvContent(sample);
    setCsvFileName('Sample_Annual_FDR_Reconciliation_Schedule.csv');
  };

  const handleExportReport = () => {
    if (!selectedBatch) return;
    const headers = ['FDR Number', 'Institution', 'Bank', 'Reported Amount', 'System Amount', 'Variance Status', 'Resolution Notes'];
    const rows = selectedBatch.records.map((r) => [
      `"${r.fdrNumber}"`,
      `"${r.institutionName}"`,
      `"${r.bankName}"`,
      r.reportedAmount,
      r.systemAmount || 'N/A',
      `"${r.status}"`,
      `"${r.notes || ''}"`,
    ]);

    const csvData = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvData));
    link.setAttribute('download', `Reconciliation_Report_${selectedBatch.id}.csv`);
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
            <Layers className="w-5 h-5 text-gov-navy" />
            <span>Institution-Wise Reconciliation Engine</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Bulk ingest institution financial schedules, algorithmically match FDR records, and review variance flags
          </p>
        </div>

        {selectedBatch && (
          <button
            onClick={handleExportReport}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download Reconciliation Report</span>
          </button>
        )}
      </div>

      {/* Fair Examination Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r text-xs text-amber-950 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Procedural Notice:</strong> Discrepancies identified during algorithmic reconciliation (such as omitted certificates or date differences) are technical variances requiring review. <strong>Do not automatically classify findings as fraud</strong> without obtaining bank ledger confirmation.
        </div>
      </div>

      {/* Upload & Ingestion Box */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
            Upload Annual Audit FDR Schedule (CSV)
          </h3>
          <button
            onClick={handleLoadSampleCSV}
            className="text-xs text-gov-navy hover:underline font-semibold"
          >
            Load Sample CSV Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              id="recon-file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            {csvFileName ? (
              <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold">
                <FileText className="w-4 h-4 text-gov-navy" />
                <span>Selected: {csvFileName}</span>
              </div>
            ) : (
              <label htmlFor="recon-file" className="cursor-pointer space-y-1 block">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-gov-navy font-bold hover:underline block">
                  Select CSV Schedule
                </span>
                <span className="text-[11px] text-slate-500">
                  Expected format: FDR Number, Bank Name, Reported Amount, Maturity Date
                </span>
              </label>
            )}
          </div>

          <div>
            <button
              onClick={handleRunReconciliation}
              disabled={!csvContent}
              className="w-full py-2.5 bg-gov-navy hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded shadow-xs transition"
            >
              Run Algorithmic Matching
            </button>
          </div>
        </div>
      </div>

      {/* Batches & Results View */}
      {selectedBatch && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Batch Summary Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">{selectedBatch.fileName}</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Ingested on {new Date(selectedBatch.uploadedAt).toLocaleDateString()} &bull; Total: {selectedBatch.totalRecords}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded">
                Matched: {selectedBatch.matchedRecords}
              </span>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded">
                Flagged / Variance: {selectedBatch.flaggedRecords}
              </span>
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-semibold rounded">
                Status: {selectedBatch.status}
              </span>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">FDR Number</th>
                  <th className="py-2.5 px-4">Bank</th>
                  <th className="py-2.5 px-4">Reported Principal</th>
                  <th className="py-2.5 px-4">System Principal</th>
                  <th className="py-2.5 px-4">Variance Outcome</th>
                  <th className="py-2.5 px-4">Detailed Notes</th>
                  <th className="py-2.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedBatch.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.fdrNumber}</td>
                    <td className="py-3 px-4 text-slate-700">{r.bankName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatINR(r.reportedAmount)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.systemAmount ? formatINR(r.systemAmount) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          r.status === 'MATCHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'MISSING_IN_SYSTEM'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[240px]">
                      {r.notes}
                      {r.isResolved && r.resolutionReason && (
                        <div className="text-emerald-700 font-medium text-[10px] mt-0.5">
                          Resolved: {r.resolutionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!r.isResolved ? (
                        <button
                          onClick={() => setResolvingRecordId(r.id)}
                          className="px-2.5 py-1 bg-gov-navy text-white hover:bg-blue-900 rounded font-semibold text-[11px]"
                        >
                          Resolve Flag
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">
              Clear Reconciliation Discrepancy Flag
            </h3>
            <p className="text-xs text-slate-500">
              Provide an official administrative justification for waiving or reconciling this schedule entry.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Justification:
              </label>
              <textarea
                rows={3}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="e.g. Verified with bank branch letter ref #498; certificate newly created."
                className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setResolvingRecordId(null)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveFlag}
                className="px-4 py-1.5 bg-gov-navy text-white font-semibold rounded text-xs hover:bg-blue-900"
              >
                Sign Off & Clear Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
