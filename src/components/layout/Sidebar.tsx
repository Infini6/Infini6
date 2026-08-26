import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  LayoutDashboard,
  CalendarCheck2,
  Users2,
  Stethoscope,
  Building,
  Activity,
  MapPin,
  GitMerge,
  BarChart3,
  AlertTriangle,
  Settings,
  User,
  Layers,
  Clock,
  Radio,
  FileCheck2,
  LogOut,
} from "lucide-react";
import { Permission } from "../../types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string | number;
  permission?: Permission;
  adminOnly?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = false,
  onClose,
}) => {
  const { user, hasPermission, logout } = useAuth();

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: "Operational Command",
      items: [
        {
          label: "Dashboard",
          to: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Live Queue Station",
          to: "/queue",
          icon: Clock,
          permission: "QUEUE_VIEW",
        },
        {
          label: "Appointments & Check-In",
          to: "/appointments",
          icon: CalendarCheck2,
          permission: "APPOINTMENT_VIEW",
        },
        {
          label: "Patient Flow & Journey",
          to: "/journey",
          icon: GitMerge,
          permission: "PATIENT_VIEW",
        },
      ],
    },
    {
      groupTitle: "Hospital & Medical Staff",
      items: [
        {
          label: "Doctor Availability",
          to: "/doctors",
          icon: Stethoscope,
          permission: "DOCTOR_VIEW",
        },
        {
          label: "Departments",
          to: "/departments",
          icon: Building,
          permission: "HOSPITAL_MANAGE",
        },
        {
          label: "Clinical Services",
          to: "/services",
          icon: Layers,
          permission: "HOSPITAL_MANAGE",
        },
      ],
    },
    {
      groupTitle: "Monitoring & Configuration",
      items: [
        {
          label: "Live Operations Board",
          to: "/operations",
          icon: Activity,
          permission: "QUEUE_VIEW",
        },
        {
          label: "Floorplan & Navigation",
          to: "/navigation",
          icon: MapPin,
          permission: "NAVIGATION_MANAGE",
        },
        {
          label: "Journey Workflow Config",
          to: "/journey-config",
          icon: FileCheck2,
          adminOnly: true,
        },
        {
          label: "Operational Alerts",
          to: "/alerts",
          icon: AlertTriangle,
        },
        {
          label: "Hospital Analytics",
          to: "/analytics",
          icon: BarChart3,
          permission: "ANALYTICS_VIEW",
        },
      ],
    },
    {
      groupTitle: "Account & System",
      items: [
        {
          label: "Staff Profile",
          to: "/profile",
          icon: User,
        },
        {
          label: "Hospital Settings",
          to: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white text-slate-700 flex flex-col border-r border-slate-200/80 shadow-xs transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* User Context Strip */}
        <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="text-xs font-semibold text-slate-700 truncate">
              {user?.departmentName || "General Staff"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
            {user?.staffId}
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group, groupIdx) => {
            const filteredItems = group.items.filter((item) => {
              if (item.adminOnly && user?.role !== "HOSPITAL_ADMIN") return false;
              if (item.permission && !hasPermission(item.permission)) return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={groupIdx}>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {group.groupTitle}
                </p>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-100/80"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
