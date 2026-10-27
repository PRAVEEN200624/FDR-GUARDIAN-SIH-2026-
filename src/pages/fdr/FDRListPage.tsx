import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { FDRRecord, User } from '../../types';
import { FDRService } from '../../services/fdr.service';
import { getStoredBanks, getStoredInstitutions, subscribeToStorage } from '../../lib/storage';
import { formatINR, formatDate, getStatusBadge } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const FDRListPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [selectedInstitution, setSelectedInstitution] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof FDRRecord>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const banks = getStoredBanks();
  const institutions = getStoredInstitutions();

  useEffect(() => {
    const update = () => {
      setFdrs(FDRService.getAllFDRs(undefined, currentUser));
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, [currentUser]);

  // Sync query params if present
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
    const s = searchParams.get('status');
    if (s) setSelectedStatus(s);
  }, [searchParams]);

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return fdrs
      .filter((r) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchNumber = r.fdrNumber.toLowerCase().includes(q);
          const matchInst = r.institutionName.toLowerCase().includes(q);
          const matchBank = r.bankName.toLowerCase().includes(q);
          const matchHolder = r.holderName.toLowerCase().includes(q);
          if (!matchNumber && !matchInst && !matchBank && !matchHolder) return false;
        }

        if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
        if (selectedBank !== 'ALL' && r.bankId !== selectedBank) return false;
        if (selectedInstitution !== 'ALL' && r.institutionId !== selectedInstitution) return false;
        if (selectedCategory !== 'ALL' && r.depositCategory !== selectedCategory) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [fdrs, searchQuery, selectedStatus, selectedBank, selectedInstitution, selectedCategory, sortField, sortAsc]);

  // Pagination slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const handleSort = (field: keyof FDRRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedBank('ALL');
    setSelectedInstitution('ALL');
    setSelectedCategory('ALL');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = [
      'FDR Number',
      'Institution Name',
      'Permanent ID',
      'Bank Name',
      'Branch',
      'Principal Amount (INR)',
      'Issue Date',
      'Maturity Date',
      'Interest Rate (%)',
      'Deposit Category',
      'Bank Status',
      'Regulatory Status',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.fdrNumber}"`,
      `"${r.institutionName}"`,
      `"${r.institutionPermanentId}"`,
      `"${r.bankName}"`,
      `"${r.branchName}"`,
      r.principalAmount,
      r.issueDate,
      r.maturityDate,
      r.interestRate,
      `"${r.depositCategory}"`,
      `"${r.bankVerification.status}"`,
      `"${r.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FDR_Guardian_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allStatuses = [
    'ALL',
    'Submitted',
    'Ready for Bank Verification',
    'Bank Verification Pending',
    'Bank Confirmed',
    'Bank Mismatch',
    'Under Regulatory Review',
    'Clarification Required',
    'Approved',
    'Rejected',
    'Renewal Pending',
    'Replacement Pending',
    'Release Pending',
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gov-navy" />
            <span>FDR Case Registry & Management</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Institutional Fixed Deposit Receipts under statutory regulatory custody
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {(currentUser.role === 'INSTITUTION' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => navigate('/fdr/submit')}
              className="px-4 py-2 bg-gov-navy hover:bg-blue-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Submit New FDR</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by FDR Number, Institution Name, or Bank..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded focus:border-gov-navy transition text-slate-900 placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded bg-white text-slate-800 focus:border-gov-navy"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded bg-white text-slate-800 focus:border-gov-navy"
            >
              <option value="ALL">All Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {currentUser.role !== 'INSTITUTION' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Institution:</span>
                <select
                  value={selectedInstitution}
                  onChange={(e) => {
                    setSelectedInstitution(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs py-1 px-2 border border-slate-200 rounded bg-slate-50 text-slate-800"
                >
                  <option value="ALL">All Institutions</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1 px-2 border border-slate-200 rounded bg-slate-50 text-slate-800"
              >
                <option value="ALL">All Deposit Categories</option>
                <option value="PERMANENT_SECURITY">Permanent Security</option>
                <option value="INFRASTRUCTURE_FUND">Infrastructure Fund</option>
                <option value="COURSE_AFFILIATION">Course Affiliation</option>
                <option value="ENDOWMENT">Endowment</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredRecords.length}</span> of {fdrs.length} records
            </span>
            <button
              onClick={resetFilters}
              className="text-gov-navy hover:underline flex items-center gap-1 font-semibold ml-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main FDR Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('fdrNumber')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>FDR Certificate No.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Bank & Branch</th>
                <th
                  onClick={() => handleSort('principalAmount')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Principal (INR)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('maturityDate')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Maturity Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Bank Verification</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No FDR records match the specified filters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {item.fdrNumber}
                        {item.renewalCount > 0 && (
                          <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded">
                            R{item.renewalCount}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1 max-w-[220px]">
                          {item.institutionName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.institutionPermanentId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{item.bankName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {item.branchName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatINR(item.principalAmount)}
                        <div className="text-[10px] text-slate-500 font-normal">
                          @{item.interestRate}% p.a.
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{formatDate(item.maturityDate)}</div>
                        <div className="text-[10px] text-slate-500">Issued: {formatDate(item.issueDate)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.bankVerification.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.bankVerification.status === 'MISMATCH'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {item.bankVerification.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/fdr/${item.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-gov-navy hover:text-white text-slate-800 font-semibold rounded text-xs border border-slate-300 transition flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Case</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-bold text-slate-800">{currentPage}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${
                    currentPage === i + 1
                      ? 'bg-gov-navy text-white'
                      : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
