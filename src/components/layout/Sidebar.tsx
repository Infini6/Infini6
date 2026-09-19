import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Monitor, 
  Calendar, 
  Stethoscope, 
  Building, 
  Activity, 
  Compass, 
  GitFork, 
  BarChart3, 
  Bell, 
  Settings, 
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  to: string;
  icon: any;
  roles?: ('DOCTOR' | 'HOSPITAL_STAFF' | 'HOSPITAL_ADMIN')[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Queue Manager', to: '/queue', icon: Users },
  { name: 'Live Display Board', to: '/queue/live', icon: Monitor, badge: 'TV' },
  { name: 'Appointments', to: '/appointments', icon: Calendar },
  { name: 'Doctors & Duty', to: '/doctors', icon: Stethoscope },
  { name: 'Departments', to: '/departments', icon: Building },
  { name: 'Clinical Services', to: '/services', icon: Activity },
  { name: 'Hospital Navigation', to: '/navigation', icon: Compass },
  { 
    name: 'Care Journey Config', 
    to: '/journey-config', 
    icon: GitFork,
    roles: ['HOSPITAL_ADMIN', 'HOSPITAL_STAFF'] 
  },
  { 
    name: 'OPD Analytics', 
    to: '/analytics', 
    icon: BarChart3,
    roles: ['HOSPITAL_ADMIN'] 
  },
  { name: 'Notifications', to: '/notifications', icon: Bell },
  { name: 'My Profile', to: '/profile', icon: User },
  { 
    name: 'Hospital Settings', 
    to: '/settings', 
    icon: Settings,
    roles: ['HOSPITAL_ADMIN'] 
  },
];

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const currentRole = user?.profile?.role;

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!currentRole) return false;
    return item.roles.includes(currentRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header with close button */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 md:hidden">
          <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
          <button onClick={onClose} className="p-1 rounded-md text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Clinical Operations
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group select-none',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-blue-600" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500">
            Smart Hospital OPD Platform
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Hospital Portal v1.0 • Supabase
          </div>
        </div>
      </aside>
    </>
  );
};
