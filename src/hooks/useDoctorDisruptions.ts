import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { appointmentService } from '../services/appointmentService';
import { queryKeys } from '../query/queryKeys';
import {
  DoctorDisruptionIncident,
  RescheduleActionPayload,
  RescheduleResult,
} from '../types/disruption.types';
import { useToast } from './useToast';

export function useDoctorDisruptions() {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '11111111-1111-1111-1111-111111111111';
  const actorId = user?.id;
  const actorRole = user?.profile?.role || 'HOSPITAL_STAFF';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [selectedIncident, setSelectedIncident] = useState<DoctorDisruptionIncident | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  // 1. Query all active doctor disruption incidents
  const {
    data: incidents = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.disruptions.all(hospitalId),
    queryFn: () => appointmentService.getDoctorUnavailableDisruptions(hospitalId),
    enabled: Boolean(hospitalId),
    refetchInterval: 30000, // Background sync every 30s
  });

  // 2. Computed counts across all incidents
  const { totalAffected, pendingCount, resolvedCount } = useMemo(() => {
    let affected = 0;
    let pending = 0;
    let resolved = 0;

    for (const inc of incidents) {
      affected += inc.totalAffected;
      pending += inc.pendingCount;
      resolved += inc.resolvedCount;
    }

    return { totalAffected: affected, pendingCount: pending, resolvedCount: resolved };
  }, [incidents]);

  // Invalidate all related data when appointments/queues change
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.disruptions.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.live(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });
  }, [queryClient, hospitalId]);

  // 3. Reschedule / Reassign Mutation with backend validation
  const rescheduleMutation = useMutation({
    mutationFn: async (payload: RescheduleActionPayload): Promise<RescheduleResult> => {
      return appointmentService.reassignOrRescheduleAppointment(payload, actorId, actorRole);
    },
    onSuccess: (result) => {
      showSuccess(result.message || 'Appointment rescheduled successfully.');
      invalidateAll();
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to reschedule appointment';
      showError(msg);
    },
  });

  const openResolutionModal = (incident?: DoctorDisruptionIncident) => {
    if (incident) {
      setSelectedIncident(incident);
    } else if (incidents.length > 0) {
      setSelectedIncident(incidents[0]);
    }
    setIsResolutionModalOpen(true);
  };

  const closeResolutionModal = () => {
    setIsResolutionModalOpen(false);
    setSelectedIncident(null);
  };

  return {
    incidents,
    isLoading,
    isRefetching,
    refetch,
    totalAffected,
    pendingCount,
    resolvedCount,
    hasActiveDisruptions: pendingCount > 0,
    selectedIncident,
    setSelectedIncident,
    isResolutionModalOpen,
    openResolutionModal,
    closeResolutionModal,
    rescheduleAppointment: rescheduleMutation.mutateAsync,
    isRescheduling: rescheduleMutation.isPending,
  };
}
