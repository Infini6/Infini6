import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { analyticsService } from '../services/analyticsService';
import { queryKeys } from '../query/queryKeys';

export function useDashboardStats() {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';

  return useQuery({
    queryKey: queryKeys.dashboard.stats(hospitalId),
    queryFn: () => analyticsService.getDashboardStats(hospitalId),
    enabled: Boolean(hospitalId),
    refetchInterval: 15000, // Background poll every 15s in addition to Realtime invalidation
  });
}
