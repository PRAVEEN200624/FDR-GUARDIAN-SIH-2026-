import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Bell,
  Search,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Landmark,
  UserCheck,
  Menu,
} from 'lucide-react';
import { User, NotificationItem, UserRole } from '../../types';
import { AuthService } from '../../services/auth.service';
import { getStoredNotifications, markNotificationAsRead, markAllNotificationsAsRead, subscribeToStorage } from '../../lib/storage';
import { DemoRoleSwitcherModal } from '../common/DemoRoleSwitcherModal';

interface Props {
  currentUser: User;
  onUserChanged: () => void;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<Props> = ({ currentUser, onUserChanged, onToggleSidebarMobile }) => {
  const navigate = useNavigate();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setNotifications(getStoredNotifications());
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, []);

  // Close flyouts on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fdr?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'INSTITUTION':
        return { label: 'Institution', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: Building2 };
      case 'BANK_OFFICER':
        return { label: 'Bank Officer', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Landmark };
      case 'REGULATORY_OFFICER':
        return { label: 'Regulatory Officer', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: UserCheck };
      case 'ADMIN':
        return { label: 'Administrator', bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: Shield };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const RoleIcon = badge.icon;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        {/* Subtle Hackathon Notice Strip */}
        <div className="bg-slate-900 text-slate-300 px-4 py-1 text-[11px] font-medium flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-300 font-semibold tracking-wide uppercase text-[10px]">
              Prototype Mode
            </span>
            <span className="text-slate-400">|</span>
            <span>Hackathon Prototype | Demonstration Data | Not an Official Government Portal</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>AICTE Security Deposit Verification Engine</span>
            <span>v1.2.0-demo</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebarMobile}
              className="md:hidden p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded bg-gov-navy text-amber-400 flex items-center justify-center font-bold shadow-xs border border-blue-950">
                <Shield className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-slate-900 text-base group-hover:text-gov-navy transition">
                    FDR GUARDIAN
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                    E-Gov AI
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Institutional Security Deposit & FDR Management System
                </div>
              </div>
            </div>
          </div>

          {/* Center Search */}
          <div className="hidden lg:block max-w-md w-full">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FDR number, institution name, or bank..."
                className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-gov-navy transition text-slate-900 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono"
              >
                Enter
              </button>
            </form>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Button */}
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-md text-xs font-semibold transition"
              title="Switch demo persona for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Switch Persona</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Flyout */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Notifications ({unreadCount} Unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead()}
                        className="text-[11px] text-gov-navy hover:underline font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications to display.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 flex items-start gap-2.5 ${
                            !n.isRead ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.type === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {n.title}
                            </div>
                            <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                              {n.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gov-navy text-white text-xs font-bold flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block leading-tight text-xs">
                  <div className="font-semibold text-slate-900 line-clamp-1 max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className={`px-1 rounded text-[9px] font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                      <RoleIcon className="w-3 h-3 text-slate-600" />
                      <span>{currentUser.designation || badge.label}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsRoleModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Switch Role Persona</span>
                  </button>

                  <button
                    onClick={() => {
                      AuthService.logout();
                      onUserChanged();
                      navigate('/auth/login');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Demo Role Switcher Modal */}
      <DemoRoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onRoleSwitched={onUserChanged}
      />
    </>
  );
};
