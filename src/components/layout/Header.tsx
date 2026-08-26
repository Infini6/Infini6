import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { MOCK_STAFF_USERS } from "../../auth/mockStaff";
import { ConnectionStatusBadge } from "../common/ConnectionStatusBadge";
import { RoleBadge } from "../common/RoleBadge";
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Stethoscope,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Menu,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "../../services/journeyApi";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchUser, currentHospitalId, setHospitalId } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.getNotifications,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSwitchStaff = async (staffId: string) => {
    await switchUser(staffId);
    setShowRoleSwitcher(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Hospital Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {user?.hospitalName || "Metropolitan Central Hospital"}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                  Staff Portal
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Smart Queue & Clinical Operations Command
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Status & Tenant Context */}
        <div className="hidden md:flex items-center gap-3">
          <ConnectionStatusBadge />
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>ID: <strong className="text-slate-800">{currentHospitalId}</strong></span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Staff Account Switcher */}
          <div className="relative">
            <button
              id="staff-role-switcher-btn"
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
                setShowNotifs(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition shadow-2xs text-left"
              title="Switch Staff Role & Account for Demo/Testing"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </p>
                <div className="mt-0.5">
                  {user && <RoleBadge role={user.role} />}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name.charAt(0)
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Switch Active Staff Account
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test role-based UI and clinical workflows
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {MOCK_STAFF_USERS.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => handleSwitchStaff(staff.id)}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition ${
                        user?.id === staff.id ? "bg-indigo-50/70 border-l-3 border-indigo-600" : ""
                      }`}
                    >
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {staff.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <RoleBadge role={staff.role} />
                          <span className="text-[10px] text-slate-400">
                            {staff.staffId}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition shadow-2xs"
            title={soundEnabled ? "Audio chime active for Called Patients" : "Audio muted"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button
              id="notifications-bell-btn"
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowRoleSwitcher(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition shadow-2xs"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Hospital Operational Alerts
                  </span>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    View All ({notifications.length})
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 text-left hover:bg-slate-50 transition ${
                        !notif.read ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleSwitcher(false);
                setShowNotifs(false);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition shadow-2xs"
              aria-label="User profile settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Staff Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Hospital Settings
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Sign Out of Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
