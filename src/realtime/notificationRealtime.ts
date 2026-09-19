import { queryClient } from '../query/queryClient';
import { RealtimeEventPayload } from './queueRealtime';
import { toastNotifier } from '../services/toastNotifier';

export const notificationRealtimeHandler = {
  handle(payload: RealtimeEventPayload, _hospitalId: string) {
    if (payload.table !== 'notifications') return;

    // 1. Immediately invalidate notification queries to update unread badge and lists
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // 2. On INSERT, display realtime toast notification
    if (payload.eventType === 'INSERT' && payload.new) {
      const notif = payload.new as any;
      const title = notif.title || 'Notification';
      const message = notif.message || '';
      const isEmergency = notif.type === 'EMERGENCY' || notif.type === 'SYSTEM_ALERT';
      const isSuccess = notif.type === 'PATIENT_CALLED' || notif.type === 'JOURNEY_UPDATED';
      const toastType = isEmergency ? 'error' : isSuccess ? 'success' : 'info';

      toastNotifier.notify(toastType, title, message);
    }
  },
};
