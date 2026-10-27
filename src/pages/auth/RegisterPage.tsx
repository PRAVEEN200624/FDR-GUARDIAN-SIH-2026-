import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Landmark,
  UserCheck,
  Shield,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  User,
  Info,
  ArrowRight,
  Clock,
  FileText,
  BadgeAlert,
  PlusCircle,
} from 'lucide-react';
import { AuthService } from '../../services/auth.service';
import { api, StateItem, DistrictItem, InstitutionItem, BankItem } from '../../services/api';
import { UserRole, RegistrationRequest } from '../../types';
import { getStoredBanks } from '../../lib/storage';
import {
  DEFAULT_STATES,
  DEFAULT_BANKS,
  FALLBACK_DISTRICTS,
  FALLBACK_COLLEGES,
} from '../../services/locationData';

interface Props {
  onLoginSuccess: (user: any) => void;
}

export const RegisterPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const defaultBanks = getStoredBanks();

  // Role Selection Tab
  const [selectedRole, setSelectedRole] = useState<UserRole>('INSTITUTION');

  // Common Fields
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [authorizationReference, setAuthorizationReference] = useState('');
  const [supportingNote, setSupportingNote] = useState('');

  // Location Hierarchy: State -> District -> Institution (Preloaded with full official defaults)
  const [statesList, setStatesList] = useState<StateItem[]>(DEFAULT_STATES);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [districtsList, setDistrictsList] = useState<DistrictItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [institutionsList, setInstitutionsList] = useState<InstitutionItem[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);

  // Missing Institution Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [missingInstName, setMissingInstName] = useState('');
  const [requestSubmittedMsg, setRequestSubmittedMsg] = useState<string | null>(null);

  // Role-Specific Fields: Institution
  const [institutionName, setInstitutionName] = useState('');
  const [permanentId, setPermanentId] = useState('');
  const [instType, setInstType] = useState('ENGINEERING');

  // Role-Specific Fields: Bank Officer (Preloaded with full official defaults)
  const [banksList, setBanksList] = useState<BankItem[]>(DEFAULT_BANKS);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>(DEFAULT_BANKS[0].id);
  const [branchName, setBranchName] = useState('');

  // Role-Specific Fields: AICTE Regulatory Officer
  const [aicteBureau, setAicteBureau] = useState('Approval Bureau, Headquarters, New Delhi');

  // Submission State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<RegistrationRequest | null>(null);

  const selectedBank = banksList.find((b) => b.id === selectedBankId) || banksList[0] || DEFAULT_BANKS[0];

  // Auto-focus first match when searching banks
  useEffect(() => {
    if (bankSearch.trim()) {
      const match = banksList.find(
        (b) =>
          b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
          b.code.toLowerCase().includes(bankSearch.toLowerCase())
      );
      if (match) setSelectedBankId(match.id);
    }
  }, [bankSearch, banksList]);

  // Fetch States and Banks on component mount from API
  useEffect(() => {
    api.locations
      .getStates()
      .then((data) => {
        if (data && data.length > 0) setStatesList(data);
      })
      .catch((err) => {
        console.warn('Could not load states from API, using preloaded data:', err);
      });

    api.banks
      .list()
      .then((data) => {
        if (data && data.length > 0) {
          setBanksList(data);
          if (!selectedBankId) setSelectedBankId(data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not load banks from API, using preloaded data:', err);
      });
  }, []);

  const handleStateChange = async (stateId: number) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId(null);
    setSelectedInstitutionId('');

    // Immediate fallback districts so UI is never stuck
    const fallbackDists = FALLBACK_DISTRICTS[stateId] || [];
    setDistrictsList(fallbackDists);
    setInstitutionsList([]);

    if (stateId) {
      try {
        const dists = await api.locations.getDistricts(stateId);
        if (dists && dists.length > 0) {
          setDistrictsList(dists);
        }
      } catch (e) {
        console.error('Error fetching districts from API, using preloaded:', e);
      }
    }
  };

  const handleDistrictChange = async (districtId: number) => {
    setSelectedDistrictId(districtId);
    setSelectedInstitutionId('');

    // Immediate fallback colleges for instant response
    const key = `${selectedStateId}-${districtId}`;
    const fallbackColleges = FALLBACK_COLLEGES[key] || [];
    setInstitutionsList(fallbackColleges);

    if (districtId && selectedStateId) {
      setIsLoadingInstitutions(true);
      try {
        const insts = await api.locations.getInstitutions({ district_id: districtId, state_id: selectedStateId });
        if (insts && insts.length > 0) {
          setInstitutionsList(insts);
        }
        setIsLoadingInstitutions(false);
      } catch (e) {
        console.error('Error fetching institutions:', e);
        setIsLoadingInstitutions(false);
      }
    }
  };

  const handleInstitutionSelect = (instId: string) => {
    setSelectedInstitutionId(instId);
    const inst = institutionsList.find((i) => i.id === instId);
    if (inst) {
      setInstitutionName(inst.institution_name);
      if (inst.institution_code) setPermanentId(inst.institution_code);
    }
  };

  const handleMissingInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingInstName.trim() || !selectedStateId || !selectedDistrictId) {
      alert('Please enter the institution name and ensure State and District are selected.');
      return;
    }
    try {
      await api.locations.requestInstitutionAddition({
        institution_name: missingInstName.trim(),
        state_id: selectedStateId,
        district_id: selectedDistrictId,
      });
      setRequestSubmittedMsg(`Request submitted for "${missingInstName}". System administrators will verify and add it.`);
      setInstitutionName(missingInstName.trim());
      setIsRequestModalOpen(false);
      setMissingInstName('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit institution addition request.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Common Validations
    if (!applicantName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please complete all mandatory personal identification and credential fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password confirmation does not match.');
      return;
    }

    // Role-specific Validations
    if (selectedRole === 'INSTITUTION') {
      if (!selectedInstitutionId && !institutionName.trim()) {
        setErrorMsg('Please select your accredited institution from the dependent dropdowns.');
        return;
      }
      if (!permanentId.trim()) {
        setErrorMsg('AICTE Permanent ID / State Identifier is required.');
        return;
      }
    } else if (selectedRole === 'BANK_OFFICER') {
      if (!employeeId.trim() || !designation.trim() || !branchName.trim()) {
        setErrorMsg('Bank Employee Identifier, Designation, and Branch Unit are mandatory.');
        return;
      }
    } else if (selectedRole === 'REGULATORY_OFFICER') {
      if (!employeeId.trim() || !designation.trim() || !authorizationReference.trim()) {
        setErrorMsg('Regulatory Employee ID, Designation, and Official Appointment Order Reference are mandatory.');
        return;
      }
    }

    setIsLoading(true);

    const roleMapping: Record<UserRole, string> = {
      INSTITUTION: 'institution_user',
      BANK_OFFICER: 'bank_officer',
      REGULATORY_OFFICER: 'regulatory_officer',
      ADMIN: 'system_admin',
    };

    const payload = {
      full_name: applicantName.trim(),
      email: email.trim().toLowerCase(),
      mobile_number: phone.trim() || '+91 99999 00000',
      password,
      requested_role: roleMapping[selectedRole],
      country: 'IN',
      state_id: selectedStateId || undefined,
      district_id: selectedDistrictId || undefined,
      institution_id: selectedInstitutionId || undefined,
      institution_name: institutionName.trim() || undefined,
      designation: designation.trim() || (selectedRole === 'INSTITUTION' ? 'Authorized Registrar' : 'Officer'),
      bank_name: selectedRole === 'BANK_OFFICER' ? selectedBank.name : undefined,
      branch_or_office: selectedRole === 'BANK_OFFICER' ? branchName.trim() : undefined,
      employee_id: employeeId.trim() || permanentId.trim() || undefined,
      office_or_jurisdiction: selectedRole === 'REGULATORY_OFFICER' ? aicteBureau : undefined,
      employee_reference: authorizationReference.trim() || undefined,
    };

    try {
      const res = await api.auth.register(payload);
      setIsLoading(false);

      if (res.user.account_status === 'pending_approval') {
        // Privileged applicant (Bank Officer or Regulatory Officer)
        const pendingReq: RegistrationRequest = {
          id: `req-${Date.now()}`,
          applicantName: res.user.full_name,
          email: res.user.email,
          phone: res.user.mobile_number || '',
          requestedRole: selectedRole,
          organizationName:
            selectedRole === 'BANK_OFFICER'
              ? selectedBank.name
              : 'AICTE (All India Council for Technical Education)',
          designation: designation.trim() || 'Officer',
          employeeId: employeeId.trim(),
          bureauOrBranch: selectedRole === 'BANK_OFFICER' ? branchName.trim() : aicteBureau,
          authorizationReference: authorizationReference.trim(),
          supportingNote: supportingNote.trim(),
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPendingConfirmation(pendingReq);
      } else {
        // Institution onboarding registered -> Redirect to Login Page
        navigate('/auth/login', {
          state: {
            registeredEmail: res.user.email,
            successMessage: `Registration successful for ${res.user.full_name}! Please sign in with your email and password to access the portal.`
          }
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Registration failed. Please check your submitted details.');
    }
  };

  // Pending Confirmation View for Privileged Applicants
  if (pendingConfirmation) {
    return (
      <div className="w-full min-h-screen flex flex-col bg-slate-100 text-slate-800">
        <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs font-medium text-center border-b border-slate-800 shrink-0">
          Hackathon Prototype | Demonstration Data | Not an Official Government Portal
        </div>

        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-8 w-full">
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xl max-w-xl w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <Clock className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                Registration Status: PENDING VERIFICATION
              </span>
              <h2 className="text-xl font-bold text-slate-900 pt-2">
                Privileged Role Request Submitted
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your application for <strong className="text-slate-900 font-semibold">{pendingConfirmation.requestedRole.replace('_', ' ')}</strong> credentials has been recorded under reference token:
                <span className="font-mono font-bold block mt-1 text-gov-navy text-sm">{pendingConfirmation.id}</span>
              </p>
            </div>

            {/* Warning Callout */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wide text-gov-navy">
                <Shield className="w-4 h-4 text-gov-navy" />
                <span>Statutory RBAC Security Enforcement:</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                In compliance with public-sector cybersecurity standards, privileged roles (Bank Verification Officers & Regulatory Review Officers) <strong>do not receive access to protected dashboards or deposit ledgers</strong> upon self-registration.
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Your official appointment orders and employee identifier ({pendingConfirmation.employeeId}) must be formally verified and approved by a <strong>System Administrator</strong> before access is provisioned.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth/login"
                className="w-full sm:w-auto px-6 py-2.5 bg-gov-navy hover:bg-blue-900 text-white font-bold rounded-lg text-xs shadow-xs transition"
              >
                Return to Portal Sign-In
              </Link>
            </div>
          </div>
        </div>

        <footer className="bg-slate-900 text-slate-400 py-3 text-center text-xs border-t border-slate-800">
          FDR Guardian &bull; Security Deposit & Fixed Deposit Receipt Verification Portal
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs font-medium text-center border-b border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              Prototype Mode
            </span>
            <span className="text-slate-600">|</span>
            <span>Hackathon Prototype &bull; Demonstration Data &bull; Not an Official Government Portal</span>
          </div>
          <div className="hidden sm:block text-slate-400 text-xs">
            National Deposit Verification Bureau &bull; v1.2.0-demo
          </div>
        </div>
      </div>

      {/* Main Centered Enrollment Area */}
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-8 w-full">
        {/* Portal Wordmark & Emblem */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gov-navy text-amber-400 shadow-lg border-2 border-slate-700/30 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gov-navy font-sans">
              FDR GUARDIAN
            </h1>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
              Official Registration
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-lg mx-auto">
            Statutory Registration & Role Authorization for Institutions, Banks, and Regulatory Authorities
          </p>
        </div>

        {/* Central Card with Generous Width */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
          {/* Card Top Title Banner */}
          <div className="bg-gov-navy text-white px-6 sm:px-8 py-4 border-b-4 border-amber-500 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase">
                Select Your Requested Role & Submit Credentials
              </h2>
            </div>
            <span className="text-xs text-blue-200 hidden sm:block">
              Statutory Bureau
            </span>
          </div>

          <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Employment Disclaimer Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Statutory Notice:</strong> Email OTP or self-registration confirms email address access but <strong>does not prove official employment or authority</strong>. Privileged Bank Officer and Regulatory Review accounts remain in <span className="font-bold text-amber-900 bg-amber-100 px-1 py-0.2 rounded">Pending</span> status until validated by an administrator.
              </div>
            </div>

            {/* STEP 1: Role Selector Radio Cards */}
            <div>
              <label className="block font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide">
                1. Select Applicant Role Category: <span className="text-rose-600">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Role A: Institution */}
                <div
                  onClick={() => setSelectedRole('INSTITUTION')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedRole === 'INSTITUTION'
                      ? 'border-gov-navy bg-blue-50/70 shadow-xs ring-1 ring-gov-navy'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    <span className="font-bold text-slate-900 text-xs">Institution User</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Onboard college, university, or polytechnic to submit and manage FDRs.
                  </p>
                </div>

                {/* Role B: Bank Officer */}
                <div
                  onClick={() => setSelectedRole('BANK_OFFICER')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedRole === 'BANK_OFFICER'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Landmark className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-slate-900 text-xs">Bank Officer</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Scheduled bank nodal desk for Core Banking (CBS) receipt verification.
                  </p>
                </div>

                {/* Role C: AICTE Regulatory Officer */}
                <div
                  onClick={() => setSelectedRole('REGULATORY_OFFICER')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedRole === 'REGULATORY_OFFICER'
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserCheck className="w-5 h-5 text-amber-700" />
                    <span className="font-bold text-slate-900 text-xs">AICTE Reviewer</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Statutory approvals bureau reviewing OCR discrepancies & decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2: Role-Specific Dynamic Fields */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
                <span>
                  2. {selectedRole === 'INSTITUTION' && 'Institution Details & Authorized Registrar'}
                  {selectedRole === 'BANK_OFFICER' && 'Bank Organization & Nodal Desk Information'}
                  {selectedRole === 'REGULATORY_OFFICER' && 'AICTE Bureau & Appointment Credentials'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Role: {selectedRole}
                </span>
              </div>

              {/* Dynamic Fields: INSTITUTION */}
              {selectedRole === 'INSTITUTION' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dependent Dropdowns */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Country <span className="text-slate-400 font-normal">(Default)</span>
                    </label>
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs flex items-center justify-between">
                      <span>India (IN)</span>
                      <span className="text-[10px] bg-blue-100 text-gov-navy px-1.5 py-0.5 rounded font-bold">Standard</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      State / Union Territory <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedStateId || ''}
                      onChange={(e) => handleStateChange(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs"
                    >
                      <option value="">-- Select State / UT --</option>
                      {statesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      District <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedDistrictId || ''}
                      onChange={(e) => handleDistrictChange(Number(e.target.value))}
                      disabled={!selectedStateId}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">
                        {!selectedStateId ? '-- Select State First --' : '-- Select District --'}
                      </option>
                      {districtsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">
                        Accredited College / Institution <span className="text-rose-600">*</span>
                      </label>
                      {selectedDistrictId && (
                        <button
                          type="button"
                          onClick={() => setIsRequestModalOpen(true)}
                          className="text-[10px] text-gov-navy hover:underline font-semibold flex items-center gap-1"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Missing? Request
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => handleInstitutionSelect(e.target.value)}
                      disabled={!selectedStateId || isLoadingInstitutions}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">
                        {!selectedStateId
                          ? '-- Select State First --'
                          : isLoadingInstitutions
                          ? '-- Fetching AICTE Colleges via API... --'
                          : institutionsList.length === 0
                          ? '-- No Colleges Found (Type Name Below or Request Addition) --'
                          : `-- Select Accredited College (${institutionsList.length} Available) --`}
                      </option>
                      {institutionsList.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.institution_name} {inst.institution_code ? `(${inst.institution_code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {requestSubmittedMsg && (
                    <div className="md:col-span-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{requestSubmittedMsg}</span>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Selected Institution Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="Selected from dropdown or requested addition"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy transition text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      AICTE Permanent ID / State Identifier <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={permanentId}
                      onChange={(e) => setPermanentId(e.target.value)}
                      placeholder="e.g. AICTE-1-49208311"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institution Type</label>
                    <select
                      value={instType}
                      onChange={(e) => setInstType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs"
                    >
                      <option value="ENGINEERING">Engineering & Technology</option>
                      <option value="MANAGEMENT">Management Studies</option>
                      <option value="POLYTECHNIC">Polytechnic Diploma</option>
                      <option value="PHARMACY">Pharmaceutical Sciences</option>
                      <option value="UNIVERSITY">University / Autonomous</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Fields: BANK OFFICER */}
              {selectedRole === 'BANK_OFFICER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Scheduled Commercial Bank ({banksList.length} Banks in India) <span className="text-rose-600">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Search all Indian banks (e.g. SBI, HDFC, Canara)..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs placeholder:text-slate-400"
                      />
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs"
                      >
                        {(bankSearch.trim()
                          ? banksList.filter(
                              (b) =>
                                b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
                                b.code.toLowerCase().includes(bankSearch.toLowerCase())
                            )
                          : banksList
                        )
                          .slice(0, 150)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="text-[10px] text-emerald-700 mt-0.5 block">
                      Official RBI Scheduled & Commercial Bank Registry active ({banksList.length} banks across India)
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Branch / Institutional Desk Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Chandrasekharpur Institutional Branch, Bhubaneswar"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bank Employee Staff ID / Token <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder="e.g. SBI-EMP-44912"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Designation <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Chief Manager, Institutional Accounts"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Branch Delegation Order / Authorization Reference
                    </label>
                    <input
                      type="text"
                      value={authorizationReference}
                      onChange={(e) => setAuthorizationReference(e.target.value)}
                      placeholder="e.g. SBI/BOD/NODAL-OFFICER/2026/09"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Fields: AICTE REGULATORY OFFICER */}
              {selectedRole === 'REGULATORY_OFFICER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      AICTE Bureau / Regional Office Assignment <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={aicteBureau}
                      onChange={(e) => setAicteBureau(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-gov-navy text-xs font-medium"
                    >
                      <option value="Approval Bureau, Headquarters, New Delhi">Approval Bureau, Headquarters, New Delhi</option>
                      <option value="Finance & Institutional Accounts Bureau, New Delhi">Finance & Institutional Accounts Bureau, New Delhi</option>
                      <option value="Western Regional Office (WRO), Mumbai">Western Regional Office (WRO), Mumbai</option>
                      <option value="Eastern Regional Office (ERO), Kolkata">Eastern Regional Office (ERO), Kolkata</option>
                      <option value="Southern Regional Office (SRO), Chennai">Southern Regional Office (SRO), Chennai</option>
                      <option value="Northern Regional Office (NRO), Kanpur">Northern Regional Office (NRO), Kanpur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Regulatory Employee ID / Staff Token <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder="e.g. AICTE-EMP-7712"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Designation <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Joint Director (Approvals & Finance)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Statutory Gazetted / Deputation Order Reference <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={authorizationReference}
                      onChange={(e) => setAuthorizationReference(e.target.value)}
                      placeholder="e.g. AICTE/HRD/OFFICER-APPOINT/2026/410"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: Applicant Identity & Credentials */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                3. Applicant Contact & Security Credentials
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Applicant Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma or Smt. Meenakshi Sundaram"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Domain Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'REGULATORY_OFFICER'
                        ? 'officer@aicte-india.org'
                        : selectedRole === 'BANK_OFFICER'
                        ? 'officer@sbi.co.in'
                        : 'registrar@institution.edu.in'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9437012345"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supporting Justification / Notes
                  </label>
                  <input
                    type="text"
                    value={supportingNote}
                    onChange={(e) => setSupportingNote(e.target.value)}
                    placeholder="e.g. Authorized to verify institutional lien records"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Account Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gov-navy hover:bg-blue-900 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-2"
              >
                <span>
                  {isLoading
                    ? 'Submitting Request...'
                    : selectedRole === 'INSTITUTION'
                    ? 'Register Institution Account'
                    : `Submit ${selectedRole.replace('_', ' ')} Registration Request`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2 text-slate-500 text-xs">
              Already have an active authorized account?{' '}
              <Link to="/auth/login" className="text-gov-navy font-bold hover:underline">
                Sign In to Portal
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Request Missing Institution Addition */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gov-navy" />
                <h3 className="font-bold text-slate-900 text-sm">Request Institution Addition</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleMissingInstitutionSubmit} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                If your institution is not found in the official registry for the selected District, submit a request. An administrator will verify official accreditation and add it.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  disabled
                  value={statesList.find((s) => s.id === selectedStateId)?.name || 'Selected State'}
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded text-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  disabled
                  value={districtsList.find((d) => d.id === selectedDistrictId)?.name || 'Selected District'}
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded text-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Institution / College Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={missingInstName}
                  onChange={(e) => setMissingInstName(e.target.value)}
                  placeholder="e.g. Government Engineering College"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:border-gov-navy text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy text-white rounded hover:bg-blue-900 font-bold"
                >
                  Submit Addition Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-3 text-center text-xs border-t border-slate-800 shrink-0">
        FDR Guardian &bull; Security Deposit & Fixed Deposit Receipt Verification Portal &bull; Hackathon Demonstration System
      </footer>
    </div>
  );
};
