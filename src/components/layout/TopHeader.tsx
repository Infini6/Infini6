import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RealtimeIndicator } from './RealtimeIndicator';
import { RoleBadge } from './RoleBadge';
import { apiService } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { 
  Building2, 
  Bell, 
  LogOut, 
  User, 
  ChevronDown, 
  Check, 
  Menu,
  Shield,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '../../types/auth.types';

export const TopHeader: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout, switchRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const hospitalId = user?.hospital?.id || '';
  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications.all(user?.id || '', hospitalId),
    queryFn: () => apiService.getNotifications(user?.id || '', hospitalId),
    enabled: Boolean(user?.id),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roles: { role: UserRole; label: string; icon: any }[] = [
    { role: 'HOSPITAL_ADMIN', label: 'Admin View', icon: Shield },
    { role: 'HOSPITAL_STAFF', label: 'Staff View', icon: UserCheck },
    { role: 'DOCTOR', label: 'Doctor View', icon: Stethoscope },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
      {/* Left side: Hamburger (mobile) + Hospital Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-blue-600">
              Hospital Operations
            </div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              {user?.hospital?.name || 'Smart Hospital'}
            </h1>
          </div>
        </div>
      </div>

      {/* Right side: Realtime status, Role switcher, Notifications, User profile */}
      <div className="flex items-center gap-3">
        {/* Realtime Status Indicator */}
        <RealtimeIndicator />

        {/* Quick Role Switcher (Convenient for Pair-Programming & Verification) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            title="Switch Demo Role"
          >
            <span className="text-slate-400">Role:</span>
            <span className="font-semibold">{user?.profile?.role.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Perspective
              </div>
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = user?.profile?.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      {r.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Bell with unread count */}
        <Link
          to="/notifications"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          title={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Info & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-300">
              {user?.profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.profile?.name || 'Staff User'}
              </span>
              <RoleBadge role={user?.profile?.role} className="mt-0.5 text-[10px] px-1.5 py-0" />
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.profile?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={user?.profile?.role} />
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
