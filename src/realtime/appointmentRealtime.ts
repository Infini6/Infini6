import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { RealtimeEventPayload } from './queueRealtime';

export const appointmentRealtimeHandler = {
  handle(payload: RealtimeEventPayload, hospitalId: string) {
    if (payload.table !== 'appointments') return;

    // Invalidate affected appointment queries
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: ['doctors', 'appointments'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });

    // If appointment check-in or doctor assignment changed, refresh queue & doctor views
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
      queryClient.invalidateQueries({ queryKey: ['doctors', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', 'currentPatient'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', 'nextPatient'] });
    }
  },
};
