import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  Landmark,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AuthService } from '../../services/auth.service';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const getRoleDefaultPath = (role: UserRole): string => {
  switch (role) {
    case 'BANK_OFFICER':
      return '/bank/verify';
    case 'REGULATORY_OFFICER':
      return '/regulatory/review';
    case 'INSTITUTION':
      return '/fdr';
    case 'ADMIN':
      return '/admin/registration-requests';
    default:
      return '/';
  }
};

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
    }
  }, [location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your registered official email and account password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.login({ email: email.trim(), password: password.trim() });
      setIsLoading(false);

      if (res.user.account_status === 'pending_approval') {
        setErrorMsg(
          `Registration Under Review: Your privileged account registration as ${res.user.role.replace('_', ' ').toUpperCase()} is currently pending administrative verification by AICTE System Administrators. Privileged permissions are disabled.`
        );
        return;
      }

      if (res.user.account_status === 'rejected') {
        setErrorMsg('Access Denied: Your official registration request was rejected by the system administrator.');
        return;
      }

      if (res.user.account_status === 'suspended') {
        setErrorMsg('Access Restricted: Your account has been administratively suspended.');
        return;
      }

      const roleMapping: Record<string, UserRole> = {
        institution_user: 'INSTITUTION',
        bank_officer: 'BANK_OFFICER',
        regulatory_officer: 'REGULATORY_OFFICER',
        system_admin: 'ADMIN',
      };

      const mappedRole: UserRole = roleMapping[res.user.role] || 'INSTITUTION';

      const frontendUser: User = {
        id: res.user.id,
        name: res.user.full_name,
        email: res.user.email,
        role: mappedRole,
        designation:
          res.user.institution_profile?.designation ||
          res.user.bank_profile?.designation ||
          res.user.regulatory_profile?.designation ||
          'Authorized Official',
        phone: res.user.mobile_number,
        institutionId: res.user.institution_profile?.institution_id,
        institutionName: res.user.institution_profile?.institution_name,
        bankName: res.user.bank_profile?.bank_name,
        isApproved: res.user.account_status === 'approved',
        createdAt: res.user.created_at,
      };

      // 1. Persist active user to AuthService & LocalStorage
      AuthService.switchUser(frontendUser);

      // 2. Propagate to App state
      onLoginSuccess(frontendUser);

      // 3. Navigate directly to role-specific workspace
      const targetPath = getRoleDefaultPath(mappedRole);
      navigate(targetPath);
    } catch (err: any) {
      console.warn('Backend API login unavailable (falling back to client store):', err.message);
      
      // Seamless fallback to client-side reactive store (for Netlify/Vercel/Offline)
      const localResult = AuthService.login(email.trim());
      setIsLoading(false);

      if (localResult.success && localResult.user) {
        AuthService.switchUser(localResult.user);
        onLoginSuccess(localResult.user);
        const targetPath = getRoleDefaultPath(localResult.user.role);
        navigate(targetPath);
        return;
      }

      if (localResult.isPending) {
        setErrorMsg(localResult.error || 'Your registration is currently pending administrative verification.');
        return;
      }

      setErrorMsg(localResult.error || err.message || 'Invalid email or password. Please check your credentials.');
    }
  };

  const handleQuickDemoFill = (role: UserRole) => {
    const credentialsMap: Record<UserRole, { email: string; pass: string }> = {
      INSTITUTION: { email: 'dean.ceg@annauniv.edu', pass: 'Demo@1234' },
      BANK_OFFICER: { email: 'amitav.sengupta@sbi.co.in', pass: 'Demo@1234' },
      REGULATORY_OFFICER: { email: 'meenakshi.sundaram@aicte-india.org', pass: 'Demo@1234' },
      ADMIN: { email: 'admin@fdrguardian.demo.gov.in', pass: 'Demo@1234' },
    };

    const creds = credentialsMap[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
      setErrorMsg(null);
      setSuccessMsg(`Loaded credentials for ${role.replace('_', ' ')}. Click "Sign In to FDR Guardian" below to enter.`);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Government Strip Notice */}
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

      {/* Main Centered Authentication Area */}
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
              e-Gov AI
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
            Institutional Security Deposit & Fixed Deposit Receipt Management Portal
          </p>
        </div>

        {/* Central Card with Generous Width & Crisp Spacing */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
          {/* Card Top Title Banner */}
          <div className="bg-gov-navy text-white px-6 sm:px-8 py-4 border-b-4 border-amber-500 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase">
                Authorized Administrative Access
              </h2>
            </div>
            <span className="text-xs text-blue-200 hidden sm:block">
              Secure Sign-In
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Quick Demo Persona Selector */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-950 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Demo Quick-Fill Credentials (Role Switcher)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-extrabold tracking-wide">
                  Auto-Fill Form
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Click any role persona below to load official demo credentials into the login fields below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('INSTITUTION')}
                  className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition group shadow-2xs flex items-center gap-3"
                >
                  <div className="p-2 bg-blue-50 group-hover:bg-blue-100 rounded-lg text-blue-700">
                    <Building2 className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs group-hover:text-blue-900">
                      Institution User
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Dr. K. Suganthi &bull; College of Engineering Guindy
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('BANK_OFFICER')}
                  className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl text-left transition group shadow-2xs flex items-center gap-3"
                >
                  <div className="p-2 bg-emerald-50 group-hover:bg-emerald-100 rounded-lg text-emerald-700">
                    <Landmark className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-900">
                      Bank Officer
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Amitav Sengupta &bull; SBI Institutional
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('REGULATORY_OFFICER')}
                  className="p-3 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl text-left transition group shadow-2xs flex items-center gap-3"
                >
                  <div className="p-2 bg-amber-50 group-hover:bg-amber-100 rounded-lg text-amber-700">
                    <UserCheck className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs group-hover:text-amber-900">
                      Regulatory Review
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Smt. Meenakshi &bull; Approvals Bureau
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('ADMIN')}
                  className="p-3 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-400 rounded-xl text-left transition group shadow-2xs flex items-center gap-3"
                >
                  <div className="p-2 bg-purple-50 group-hover:bg-purple-100 rounded-lg text-purple-700">
                    <Shield className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs group-hover:text-purple-900">
                      System Administrator
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Vikramaditya Roy &bull; Lead Admin
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400 absolute">
                Or sign in with official email
              </span>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Official Registered Email:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. registrar@institution.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-gov-navy focus:ring-1 focus:ring-gov-navy transition text-xs font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Account Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-gov-navy focus:ring-1 focus:ring-gov-navy transition text-xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-gov-navy focus:ring-gov-navy"
                  />
                  <span>Remember official session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-gov-navy hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gov-navy hover:bg-blue-900 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Authenticating Officer...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-3 border-t border-slate-100 text-slate-600 text-xs space-y-1">
                <div>
                  New user or official applicant?{' '}
                  <Link to="/auth/register" className="text-gov-navy font-bold hover:underline">
                    Register / Request Role Access
                  </Link>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  (Institution Onboarding &bull; Bank Officer &bull; AICTE Regulatory Officer)
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-3.5 text-xs text-slate-900 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Statutory Password Reset
            </h3>
            <p className="text-slate-600 leading-relaxed">
              In accordance with statutory security guidelines, administrative password resets must be verified through the designated Institutional Nodal Officer or System Administrator.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700">
              Contact Desk: <strong className="font-bold text-gov-navy">support@fdrguardian.demo.gov.in</strong>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 bg-gov-navy text-white rounded-lg font-bold hover:bg-blue-900 transition"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="bg-slate-900 text-slate-400 py-3 text-center text-xs border-t border-slate-800 shrink-0">
        FDR Guardian &bull; Security Deposit & Fixed Deposit Receipt Verification Portal &bull; Hackathon Demonstration System
      </footer>
    </div>
  );
};
