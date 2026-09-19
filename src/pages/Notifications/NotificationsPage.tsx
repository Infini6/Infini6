import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { NotificationRow } from '../../types/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  CalendarPlus,
  CalendarClock,
  UserX,
  Users,
  Megaphone,
  Compass,
  Volume2,
  ShieldAlert,
  CheckCheck,
  Filter,
  Layers,
  Inbox,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

type FilterCategory = 'ALL' | 'UNREAD' | 'OPERATIONAL' | 'CLINICAL' | 'SYSTEM';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; iconClass: string; icon: React.FC<any> }
> = {
  APPOINTMENT_CREATED: {
    label: 'Appointment Created',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'bg-blue-100 text-blue-600',
    icon: CalendarPlus,
  },
  APPOINTMENT_RESCHEDULED: {
    label: 'Appointment Rescheduled',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    iconClass: 'bg-amber-100 text-amber-600',
    icon: CalendarClock,
  },
  DOCTOR_UNAVAILABLE: {
    label: 'Doctor Unavailable',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    iconClass: 'bg-rose-100 text-rose-600',
    icon: UserX,
  },
  QUEUE_UPDATED: {
    label: 'Queue Updated',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    iconClass: 'bg-orange-100 text-orange-600',
    icon: Users,
  },
  PATIENT_CALLED: {
    label: 'Patient Called',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconClass: 'bg-emerald-100 text-emerald-600',
    icon: Megaphone,
  },
  JOURNEY_UPDATED: {
    label: 'Journey Updated',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconClass: 'bg-indigo-100 text-indigo-600',
    icon: Compass,
  },
  HOSPITAL_ANNOUNCEMENT: {
    label: 'Hospital Announcement',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    iconClass: 'bg-purple-100 text-purple-600',
    icon: Volume2,
  },
  SYSTEM_ALERT: {
    label: 'System Alert',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    iconClass: 'bg-slate-200 text-slate-700',
    icon: ShieldAlert,
  },
  // Fallback / legacy support
  QUEUE_ALERT: {
    label: 'Queue Surge',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    iconClass: 'bg-orange-100 text-orange-600',
    icon: Users,
  },
  APPOINTMENT_UPDATE: {
    label: 'Appointment Update',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'bg-blue-100 text-blue-600',
    icon: CalendarClock,
  },
  SYSTEM: {
    label: 'System Notification',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    iconClass: 'bg-slate-200 text-slate-700',
    icon: ShieldAlert,
  },
  EMERGENCY: {
    label: 'Emergency Alert',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    iconClass: 'bg-rose-100 text-rose-600',
    icon: AlertTriangle,
  },
};

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const hospitalId = user?.hospital?.id || '';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');

  // Query notifications with user RLS & hospital filter
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.notifications.all(userId, hospitalId),
    queryFn: () => apiService.getNotifications(userId, hospitalId),
    enabled: Boolean(userId),
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId, hospitalId) });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      showError('Action Failed', err?.message || 'Could not mark notification as read.');
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => apiService.markAllNotificationsRead(userId, hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId, hospitalId) });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess('All Caught Up', 'All notifications marked as read.');
    },
    onError: (err: any) => {
      showError('Action Failed', err?.message || 'Failed to mark all notifications as read.');
    },
  });

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'UNREAD') return !n.read;
      if (activeCategory === 'OPERATIONAL') {
        return (
          n.type === 'QUEUE_UPDATED' ||
          n.type === 'QUEUE_ALERT' ||
          n.type === 'PATIENT_CALLED' ||
          n.type === 'JOURNEY_UPDATED'
        );
      }
      if (activeCategory === 'CLINICAL') {
        return (
          n.type === 'APPOINTMENT_CREATED' ||
          n.type === 'APPOINTMENT_RESCHEDULED' ||
          n.type === 'APPOINTMENT_UPDATE' ||
          n.type === 'DOCTOR_UNAVAILABLE'
        );
      }
      if (activeCategory === 'SYSTEM') {
        return (
          n.type === 'HOSPITAL_ANNOUNCEMENT' ||
          n.type === 'SYSTEM_ALERT' ||
          n.type === 'SYSTEM' ||
          n.type === 'EMERGENCY'
        );
      }
      return true;
    });
  }, [notifications, activeCategory]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Notifications & Alerts
            </h2>
            {unreadCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[11px] shadow-xs">
                {unreadCount} Unread
              </span>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                All Read
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime clinical alerts, queue notifications, journey status updates, and administrative announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs gap-1.5 bg-white text-slate-700 hover:text-blue-600 border-slate-200"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              Mark All Read
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-2 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeCategory === 'ALL'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveCategory('UNREAD')}
          className={`px-3 py-2 border-b-2 font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeCategory === 'UNREAD'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveCategory('OPERATIONAL')}
          className={`px-3 py-2 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeCategory === 'OPERATIONAL'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Operational & Queue
        </button>
        <button
          onClick={() => setActiveCategory('CLINICAL')}
          className={`px-3 py-2 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeCategory === 'CLINICAL'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Clinical & Doctors
        </button>
        <button
          onClick={() => setActiveCategory('SYSTEM')}
          className={`px-3 py-2 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeCategory === 'SYSTEM'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          System & Announcements
        </button>
      </div>

      {/* Notifications List Container */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-100 rounded-xl animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
            <h3 className="text-sm font-bold text-rose-900">Unable to load notifications</h3>
            <p className="text-xs text-rose-600 mt-1">
              {(error as any)?.message || 'Database connection error.'}
            </p>
            <Button
              size="sm"
              onClick={() => refetch()}
              className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Retry
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-800">
              {activeCategory === 'UNREAD'
                ? 'No unread notifications'
                : 'No notifications found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {activeCategory === 'UNREAD'
                ? 'All clinical alerts and operational messages have been reviewed.'
                : 'When queue events, appointment changes, or announcements occur, they will appear here in realtime.'}
            </p>
            {activeCategory !== 'ALL' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveCategory('ALL')}
                className="mt-4 text-xs"
              >
                View All Notifications
              </Button>
            )}
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const config =
              NOTIFICATION_TYPE_CONFIG[n.type] || {
                label: 'General Notification',
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                iconClass: 'bg-slate-100 text-slate-600',
                icon: Bell,
              };
            const IconComponent = config.icon;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-blue-50/40 border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${config.iconClass}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Message Content */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {n.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(n.created_at)}</span>
                      <span>&bull;</span>
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action: Mark Read Button */}
                {!n.read && (
                  <div className="sm:shrink-0 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                      className="text-xs h-8 px-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark Read
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
