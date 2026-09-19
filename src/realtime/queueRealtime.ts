import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';

export interface RealtimeEventPayload {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  hospitalId?: string;
}

export const queueRealtimeHandler = {
  handle(payload: RealtimeEventPayload, hospitalId: string) {
    if (payload.table !== 'queue_entries') return;

    // 1. Invalidate queue list & live operations queries
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.live(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });

    // 2. Doctor dashboard queries
    queryClient.invalidateQueries({ queryKey: ['doctors', 'queue'] });
    queryClient.invalidateQueries({ queryKey: ['doctors', 'currentPatient'] });
    queryClient.invalidateQueries({ queryKey: ['doctors', 'nextPatient'] });

    // 3. On UPDATE, appointments status also changes (e.g. CHECKED_IN -> IN_PROGRESS -> COMPLETED)
    if (payload.eventType === 'UPDATE') {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(hospitalId) });
      queryClient.invalidateQueries({ queryKey: ['doctors', 'appointments'] });
    }
  },
};
