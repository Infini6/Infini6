import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { RealtimeEventPayload } from './queueRealtime';

export const doctorRealtimeHandler = {
  handle(payload: RealtimeEventPayload, hospitalId: string) {
    if (payload.table === 'doctors') {
      // 1. Doctor list & availability queries
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all(hospitalId) });
      queryClient.invalidateQueries({ queryKey: ['doctors', 'byUser'] });

      // 2. Dashboard metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });

      // 3. Queue Live Operations Board (doctor status panel)
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.live(hospitalId) });
    } else if (payload.table === 'doctor_schedules') {
      // Doctor schedules
      queryClient.invalidateQueries({ queryKey: ['doctors', 'schedule'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all(hospitalId) });
    }
  },
};
