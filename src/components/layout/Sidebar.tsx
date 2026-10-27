import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Landmark,
  UserCheck,
  AlertOctagon,
  CalendarDays,
  RefreshCw,
  Unlock,
  Layers,
  Calculator,
  QrCode,
  BarChart3,
  History,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface Props {
  currentUser: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<Props> = ({ currentUser, isMobileOpen, onCloseMobile }) => {
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'FDR Management',
      path: '/fdr',
      icon: FileText,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Submit New FDR',
      path: '/fdr/submit',
      icon: PlusCircle,
      roles: ['INSTITUTION', 'ADMIN'],
    },
    {
      label: 'Bank Verification',
      path: '/bank/verify',
      icon: Landmark,
      roles: ['BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
      badge: 'Assigned',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      label: 'Regulatory Review',
      path: '/regulatory/review',
      icon: UserCheck,
      roles: ['REGULATORY_OFFICER', 'ADMIN'],
      badge: 'Action',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Pending & Escalations',
      path: '/lifecycle/escalations',
      icon: AlertOctagon,
      roles: ['BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Maturity Calendar',
      path: '/lifecycle/maturity',
      icon: CalendarDays,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
      badge: 'Alerts',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Renewal & Replacement',
      path: '/lifecycle/renewals',
      icon: RefreshCw,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Release Readiness',
      path: '/lifecycle/release-readiness',
      icon: Unlock,
      roles: ['INSTITUTION', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Reconciliation Engine',
      path: '/reconciliation',
      icon: Layers,
      roles: ['INSTITUTION', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Interest Analytics',
      path: '/analytics/interest',
      icon: Calculator,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'QR Verification Demo',
      path: '/verify/pub-vfy-canara-7741-9a4f',
      icon: QrCode,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Audit Trail',
      path: '/audit',
      icon: History,
      roles: ['BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN'],
    },
    {
      label: 'Registration Requests',
      path: '/admin/registration-requests',
      icon: UserCheck,
      roles: ['ADMIN'],
      badge: 'Approvals',
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      label: 'User Management',
      path: '/admin/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'Portal Settings',
      path: '/admin/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Sidebar Top Section */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Administrative Menu
        </div>
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-gov-navy text-white font-semibold shadow-xs border-l-4 border-amber-400 pl-2.5'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Sidebar Footer Context */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 truncate">
          {currentUser.institutionName || currentUser.bankName || 'Statutory Portal Authority'}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Access Level: {currentUser.role}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
