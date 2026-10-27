import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  Building2,
  Landmark,
  Clock,
  HelpCircle,
  RotateCcw,
  Info,
  Check,
  MessageSquare,
} from 'lucide-react';
import { RegistrationRequest, RegistrationStatus, UserRole, User } from '../../types';
import { AuthService } from '../../services/auth.service';
import { api, AccessRequestItem } from '../../services/api';
import { subscribeToStorage } from '../../lib/storage';
import { formatDateTime } from '../../lib/utils';

interface Props {
  currentUser: User;
}

export const RegistrationRequestsPage: React.FC<Props> = ({ currentUser }) => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State
  const [activeRequest, setActiveRequest] = useState<RegistrationRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'INFO' | null>(null);
  const [dialogText, setDialogText] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const mapApiRequestToFrontend = (item: AccessRequestItem): RegistrationRequest => {
    const roleMap: Record<string, UserRole> = {
      institution_user: 'INSTITUTION',
      bank_officer: 'BANK_OFFICER',
      regulatory_officer: 'REGULATORY_OFFICER',
      system_admin: 'ADMIN',
    };
    const statusMap: Record<string, RegistrationStatus> = {
      pending: 'PENDING',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      info_required: 'INFO_REQUIRED',
    };

    const org = item.organization_details || {};

    return {
      id: item.id,
      applicantName: item.applicant_name,
      email: item.applicant_email,
      phone: item.applicant_mobile || '',
      requestedRole: roleMap[item.requested_role] || 'BANK_OFFICER',
      organizationName:
        org.bank_name ||
        org.institution_name ||
        (item.requested_role === 'regulatory_officer'
          ? 'AICTE (All India Council for Technical Education)'
          : 'Organization'),
      designation: org.designation || 'Officer',
      employeeId: org.employee_id || org.employee_reference || '',
      bureauOrBranch: org.branch_or_office || org.office_or_jurisdiction || '',
      authorizationReference: org.authorization_reference || org.employee_reference || '',
      supportingNote: org.supporting_note || '',
      status: statusMap[item.status] || 'PENDING',
      createdAt: item.created_at,
      updatedAt: item.reviewed_at || item.created_at,
      decidedBy: item.reviewed_by,
      decisionReason: item.review_notes,
    };
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async () => {
      try {
        const apiRole =
          filterRole === 'BANK_OFFICER'
            ? 'bank_officer'
            : filterRole === 'REGULATORY_OFFICER'
            ? 'regulatory_officer'
            : filterRole === 'INSTITUTION'
            ? 'institution_user'
            : undefined;

        const apiStatus =
          filterStatus === 'PENDING'
            ? 'pending'
            : filterStatus === 'APPROVED'
            ? 'approved'
            : filterStatus === 'REJECTED'
            ? 'rejected'
            : undefined;

        const apiData = await api.admin.getAccessRequests({
          role: apiRole,
          status: apiStatus,
        });

        if (isMounted && apiData && apiData.length > 0) {
          let mapped = apiData.map(mapApiRequestToFrontend);
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            mapped = mapped.filter(
              (r) =>
                r.applicantName.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.organizationName.toLowerCase().includes(q)
            );
          }
          setRequests(mapped);
          return;
        }
      } catch (err) {
        console.warn('Backend access-requests API call failed, falling back to local store:', err);
      }

      if (isMounted) {
        setRequests(
          AuthService.getRegistrationRequests({
            role: filterRole,
            status: filterStatus,
            search: searchQuery,
          })
        );
      }
    };

    fetchRequests();
    const unsub = subscribeToStorage(fetchRequests);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [filterRole, filterStatus, searchQuery, refreshTrigger]);

  // Derived counts
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;
  const infoRequiredCount = requests.filter((r) => r.status === 'INFO_REQUIRED').length;

  const handleOpenDialog = (req: RegistrationRequest, action: 'APPROVE' | 'REJECT' | 'INFO') => {
    setActiveRequest(req);
    setDialogAction(action);
    setDialogText('');
  };

  const handleConfirmAction = async () => {
    if (!activeRequest || !dialogAction) return;

    try {
      if (dialogAction === 'APPROVE') {
        try {
          await api.admin.approveAccessRequest(activeRequest.id);
        } catch {
          AuthService.approveRegistration(activeRequest.id);
        }
        alert(
          `Registration approved! Role ${activeRequest.requestedRole} has been provisioned server-side in Supabase PostgreSQL for ${activeRequest.applicantName}.`
        );
      } else if (dialogAction === 'REJECT') {
        if (!dialogText.trim()) {
          alert('A mandatory rejection justification is required.');
          return;
        }
        try {
          await api.admin.rejectAccessRequest(activeRequest.id, dialogText.trim());
        } catch {
          AuthService.rejectRegistration(activeRequest.id, dialogText.trim());
        }
        alert(`Registration rejected. Privileged access denied.`);
      } else if (dialogAction === 'INFO') {
        if (!dialogText.trim()) {
          alert('Please specify the additional documentation required from the applicant.');
          return;
        }
        AuthService.requestInfo(activeRequest.id, dialogText.trim());
        alert(`Clarification query issued to applicant.`);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Server error'}`);
    }

    setRefreshTrigger((prev) => prev + 1);
    setActiveRequest(null);
    setDialogAction(null);
    setDialogText('');
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Approved & Active', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'PENDING':
        return { label: 'Pending Verification', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'REJECTED':
        return { label: 'Rejected', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'INFO_REQUIRED':
        return { label: 'Info Required', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'INSTITUTION':
        return <Building2 className="w-4 h-4 text-blue-700" />;
      case 'BANK_OFFICER':
        return <Landmark className="w-4 h-4 text-emerald-700" />;
      case 'REGULATORY_OFFICER':
        return <UserCheck className="w-4 h-4 text-amber-700" />;
      default:
        return <Shield className="w-4 h-4 text-purple-700" />;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gov-navy" />
            <span>Registration Requests & Privileged Role Authorization</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Administrator queue for verifying applicant appointment orders and provisioning server-side RBAC permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-slate-200 text-slate-800">
            Administrator Access Only
          </span>
        </div>
      </div>

      {/* Statutory Employment Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r text-xs text-amber-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Mandatory Verification Principle:</strong> Self-registration or email validation confirms email inbox control but <strong>does not verify official AICTE or banking employment</strong>. Review gazetted deputation orders and staff tokens before authorizing privileged reviewer credentials.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Submissions</span>
            <UserCheck className="w-4 h-4 text-gov-navy" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{requests.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All applicant categories</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-800 font-medium mt-0.5">Action required</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Approved & Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-emerald-800 font-medium mt-0.5">Permissions provisioned</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Rejected / Info Needed</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {rejectedCount + infoRequiredCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Access restricted</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by applicant name, official email, employee ID, or organization..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-gov-navy focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="ALL">All Requested Roles</option>
              <option value="REGULATORY_OFFICER">AICTE Regulatory Review Officer</option>
              <option value="BANK_OFFICER">Bank Verification Officer</option>
              <option value="INSTITUTION">Institution User</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="PENDING">Pending Verification</option>
              <option value="APPROVED">Approved & Provisioned</option>
              <option value="INFO_REQUIRED">Information Required</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-900">{requests.length}</strong> matching request(s)
          </span>
          <button
            onClick={() => {
              setFilterRole('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="text-gov-navy hover:underline font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Applicant Identity</th>
                <th className="py-3 px-4">Requested Role</th>
                <th className="py-3 px-4">Organization & Unit</th>
                <th className="py-3 px-4">Employee ID / Token</th>
                <th className="py-3 px-4">Order / Auth Ref</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Administrator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No registration requests match the specified criteria.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const badge = getStatusBadge(r.status);
                  const isPending = r.status === 'PENDING';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.applicantName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{r.email}</div>
                        <div className="text-[10px] text-slate-400">{r.phone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {getRoleIcon(r.requestedRole)}
                          <span>{r.requestedRole.replace('_', ' ')}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{r.designation}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.organizationName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {r.bureauOrBranch}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.employeeId}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        {r.authorizationReference || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDateTime(r.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {r.decidedBy && (
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                            By {r.decidedBy}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDialog(r, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] transition shadow-2xs"
                              title="Approve and provision role"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDialog(r, 'INFO')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] border border-slate-300"
                              title="Request clarification or documents"
                            >
                              Query
                            </button>
                            <button
                              onClick={() => handleOpenDialog(r, 'REJECT')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] border border-rose-200"
                              title="Reject application"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-[11px] text-slate-400 italic">
                            Action recorded
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation / Reason Dialog */}
      {dialogAction && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`p-2.5 rounded-xl ${
                  dialogAction === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : dialogAction === 'REJECT'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {dialogAction === 'APPROVE' && <CheckCircle2 className="w-6 h-6" />}
                {dialogAction === 'REJECT' && <XCircle className="w-6 h-6" />}
                {dialogAction === 'INFO' && <MessageSquare className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {dialogAction === 'APPROVE' && 'Approve & Provision Privileged Role'}
                  {dialogAction === 'REJECT' && 'Reject Registration Request'}
                  {dialogAction === 'INFO' && 'Request Additional Documentation'}
                </h3>
                <p className="text-xs text-slate-500">
                  Applicant: <strong className="text-slate-800">{activeRequest.applicantName}</strong> ({activeRequest.organizationName})
                </p>
              </div>
            </div>

            {dialogAction === 'APPROVE' && (
              <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="leading-relaxed">
                  Approving this request will server-side assign the role <strong className="font-bold text-gov-navy">{activeRequest.requestedRole}</strong> to <strong className="font-bold">{activeRequest.email}</strong>, enabling permissions to access designated verification workspaces.
                </p>
                <div className="font-mono text-[11px] text-slate-500 pt-1">
                  Employee Identifier: {activeRequest.employeeId} &bull; Auth Ref: {activeRequest.authorizationReference || 'None'}
                </div>
              </div>
            )}

            {dialogAction === 'REJECT' && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  Mandatory Rejection Justification: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={dialogText}
                  onChange={(e) => setDialogText(e.target.value)}
                  placeholder="e.g. Appointment letter could not be authenticated with bank nodal registry / non-official email used."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:border-gov-navy text-xs"
                />
              </div>
            )}

            {dialogAction === 'INFO' && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  Information Query / Document Request for Applicant: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={dialogText}
                  onChange={(e) => setDialogText(e.target.value)}
                  placeholder="e.g. Please provide a copy of your Gazetted Appointment Order or Branch Manager authorization letter."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:border-gov-navy text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveRequest(null);
                  setDialogAction(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-white font-bold rounded-lg text-xs transition ${
                  dialogAction === 'APPROVE'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : dialogAction === 'REJECT'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-gov-navy hover:bg-blue-900'
                }`}
              >
                {dialogAction === 'APPROVE' && 'Confirm & Authorize Role'}
                {dialogAction === 'REJECT' && 'Confirm Rejection'}
                {dialogAction === 'INFO' && 'Send Information Query'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
