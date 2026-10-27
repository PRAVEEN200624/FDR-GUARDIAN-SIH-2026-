import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { User } from '../../types';
import { AuthService } from '../../services/auth.service';
import { ChevronRight, Home } from 'lucide-react';

interface Props {
  currentUser: User;
  onUserChanged: () => void;
}

export const AppLayout: React.FC<Props> = ({ currentUser, onUserChanged }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate simple breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    fdr: 'FDR Management',
    submit: 'Submit New FDR',
    bank: 'Bank Verification',
    verify: 'Verification Workspace',
    regulatory: 'Regulatory Review',
    review: 'Review Workspace',
    lifecycle: 'Lifecycle Management',
    escalations: 'Pending & Escalations',
    maturity: 'Maturity Calendar',
    renewals: 'Renewal & Replacement',
    'release-readiness': 'Release Readiness Checker',
    reconciliation: 'Reconciliation Engine',
    analytics: 'Analytics',
    interest: 'Interest Impact Analytics',
    reports: 'Reports & Analytics',
    audit: 'Audit Trail',
    admin: 'Administration',
    'registration-requests': 'Registration Requests & Role Approvals',
    users: 'User Management',
    settings: 'Portal Settings',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Header
        currentUser={currentUser}
        onUserChanged={onUserChanged}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex flex-1">
        <Sidebar
          currentUser={currentUser}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 flex flex-col pb-12">
          {/* Breadcrumb Strip */}
          {pathSegments.length > 0 && (
            <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Link to="/" className="hover:text-gov-navy flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              {pathSegments.map((seg, idx) => {
                const isLast = idx === pathSegments.length - 1;
                const label = breadcrumbMap[seg] || seg;
                const path = `/${pathSegments.slice(0, idx + 1).join('/')}`;
                return (
                  <React.Fragment key={path}>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    {isLast ? (
                      <span className="font-semibold text-slate-900">{label}</span>
                    ) : (
                      <Link to={path} className="hover:text-gov-navy">
                        {label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Child Content */}
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};
