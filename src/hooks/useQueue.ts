import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { queueService } from '../services/queueService';
import { QueueFilters } from '../types/queue.types';
import { queryKeys } from '../query/queryKeys';

export function useQueueList(filters?: QueueFilters) {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';

  return useQuery({
    queryKey: queryKeys.queue.all(hospitalId, filters as any),
    queryFn: () => queueService.getQueueEntries(hospitalId, filters),
    enabled: Boolean(hospitalId),
  });
}

export function useQueueActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.live(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(hospitalId) });
  };

  const callNextSpecificMutation = useMutation({
    mutationFn: (queueId: string) =>
      queueService.callNext(queueId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const callNextGlobalMutation = useMutation({
    mutationFn: ({ departmentId, doctorId }: { departmentId?: string; doctorId?: string } = {}) =>
      queueService.callNextPatient(hospitalId, departmentId, doctorId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      queueService.checkInPatient(appointmentId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const startConsultMutation = useMutation({
    mutationFn: (queueId: string) =>
      queueService.startConsultation(queueId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const completeConsultMutation = useMutation({
    mutationFn: (queueId: string) =>
      queueService.completeConsultation(queueId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const skipPatientMutation = useMutation({
    mutationFn: (queueId: string) =>
      queueService.skipPatient(queueId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const markNoShowMutation = useMutation({
    mutationFn: (queueId: string) =>
      queueService.markNoShow(queueId, user?.id, user?.profile?.role),
    onSuccess: invalidate,
  });

  const transferMutation = useMutation({
    mutationFn: ({
      queueId,
      targetDepartmentId,
      targetDoctorId,
    }: {
      queueId: string;
      targetDepartmentId: string;
      targetDoctorId?: string;
    }) =>
      queueService.transferQueue(
        queueId,
        targetDepartmentId,
        targetDoctorId,
        user?.id,
        user?.profile?.role
      ),
    onSuccess: invalidate,
  });

  const isProcessing =
    callNextSpecificMutation.isPending ||
    callNextGlobalMutation.isPending ||
    checkInMutation.isPending ||
    startConsultMutation.isPending ||
    completeConsultMutation.isPending ||
    skipPatientMutation.isPending ||
    markNoShowMutation.isPending ||
    transferMutation.isPending;

  return {
    callNext: callNextSpecificMutation.mutateAsync,
    callNextGlobal: callNextGlobalMutation.mutateAsync,
    checkIn: checkInMutation.mutateAsync,
    startConsultation: startConsultMutation.mutateAsync,
    completeConsultation: completeConsultMutation.mutateAsync,
    skipPatient: skipPatientMutation.mutateAsync,
    markNoShow: markNoShowMutation.mutateAsync,
    transferPatient: transferMutation.mutateAsync,
    isProcessing,
    callNextLoading: callNextGlobalMutation.isPending,
    invalidate,
  };
}

