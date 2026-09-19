import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { doctorService } from '../services/doctorService';
import { apiService } from '../services/api';
import { queryKeys } from '../query/queryKeys';
import { DoctorStatus, QueueStatus, AppointmentRow, QueueEntryRow, NotificationRow } from '../types/database.types';
import { EnrichedQueueEntry } from '../types/queue.types';
import { useToast } from './useToast';
import { useSound } from './useSound';

export function useDoctorDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const userId = user?.id || '';
  const queryClient = useQueryClient();
  const { showSuccess, showError, showInfo } = useToast();
  const { playChime } = useSound();

  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // 1. Resolve logged-in doctor profile
  const {
    data: doctor,
    isLoading: isDoctorLoading,
    error: doctorError,
    refetch: refetchDoctor,
  } = useQuery({
    queryKey: queryKeys.doctors.byUser(userId),
    queryFn: () => doctorService.getDoctorByUserId(userId),
    enabled: Boolean(userId),
  });

  const doctorId = doctor?.id || '';

  // 2. Doctor Schedule
  const { data: schedule } = useQuery({
    queryKey: queryKeys.doctors.schedule(doctorId),
    queryFn: () => doctorService.getDoctorSchedule(doctorId),
    enabled: Boolean(doctorId),
  });

  // 3. Today's Appointments for this Doctor
  const {
    data: todayAppointments = [],
    isLoading: isAppointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: queryKeys.doctors.appointments(doctorId),
    queryFn: () => doctorService.getDoctorAppointments(hospitalId, doctorId),
    enabled: Boolean(hospitalId && doctorId),
  });

  // 4. Current Patient (CALLED or IN_PROGRESS) - minimal privacy-safe display
  const {
    data: currentPatient,
    isLoading: isCurrentPatientLoading,
    refetch: refetchCurrentPatient,
  } = useQuery({
    queryKey: queryKeys.doctors.currentPatient(doctorId),
    queryFn: () => doctorService.getDoctorCurrentPatient(hospitalId, doctorId),
    enabled: Boolean(hospitalId && doctorId),
  });

  // 5. Next Patient (Server authoritative earliest WAITING)
  const {
    data: nextPatient,
    isLoading: isNextPatientLoading,
    refetch: refetchNextPatient,
  } = useQuery({
    queryKey: queryKeys.doctors.nextPatient(doctorId),
    queryFn: () => doctorService.getDoctorNextPatient(hospitalId, doctorId),
    enabled: Boolean(hospitalId && doctorId),
  });

  // 6. Doctor Active Queue Entries
  const {
    data: doctorQueue = [],
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['doctors', 'queue', doctorId],
    queryFn: () => doctorService.getDoctorQueueEntries(hospitalId, doctorId),
    enabled: Boolean(hospitalId && doctorId),
  });

  // 7. Notifications for this Doctor / User
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: queryKeys.notifications.all(userId),
    queryFn: () => apiService.getNotifications(userId),
    enabled: Boolean(userId),
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Invalidation helper
  const invalidateDoctorData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.appointments(doctorId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.currentPatient(doctorId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.nextPatient(doctorId) });
    queryClient.invalidateQueries({ queryKey: ['doctors', 'queue', doctorId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.queue.live(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
  }, [queryClient, hospitalId, doctorId, userId]);

  // 8. Consultation Actions Mutation with state pre-validation & double-action lock
  const consultationActionMutation = useMutation({
    mutationFn: async ({
      queueId,
      action,
    }: {
      queueId: string;
      action: 'CALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW';
    }) => {
      setConflictError(null);
      return doctorService.executeDoctorConsultationAction(queueId, action, doctorId, userId);
    },
    onMutate: () => {
      setIsActionProcessing(true);
    },
    onSuccess: (_, variables) => {
      invalidateDoctorData();
      if (variables.action === 'CALL') {
        playChime();
        showSuccess('Patient summoned to consultation room.');
      } else if (variables.action === 'START') {
        showSuccess('Consultation session started.');
      } else if (variables.action === 'COMPLETE') {
        showSuccess('Consultation completed successfully.');
      } else if (variables.action === 'SKIP') {
        showInfo('Patient skipped and placed in pending triage.');
      } else if (variables.action === 'NO_SHOW') {
        showInfo('Patient marked as No-Show.');
      }
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update consultation status';
      setConflictError(msg);
      showError(msg);
      invalidateDoctorData();
    },
    onSettled: () => {
      setIsActionProcessing(false);
    },
  });

  // 9. Availability Mutation with affected appointment warning
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (status: DoctorStatus) => {
      return doctorService.updateDoctorSelfAvailability(doctorId, status, userId);
    },
    onSuccess: (data) => {
      invalidateDoctorData();
      showSuccess(`Status updated to ${data.doctor.status}`);
      if (data.warningMessage) {
        showInfo(data.warningMessage);
      }
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to update availability status');
    },
  });

  // 10. Mark notification read
  const markNotificationReadMutation = useMutation({
    mutationFn: (id: string) => apiService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId) });
    },
  });

  return {
    doctor,
    doctorId,
    isDoctorLoading,
    doctorError,
    schedule,
    todayAppointments,
    isAppointmentsLoading,
    currentPatient,
    isCurrentPatientLoading,
    nextPatient,
    isNextPatientLoading,
    doctorQueue,
    isQueueLoading,
    notifications,
    unreadNotificationsCount,
    isActionProcessing,
    conflictError,
    performAction: (queueId: string, action: 'CALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW') =>
      consultationActionMutation.mutateAsync({ queueId, action }),
    updateAvailability: (status: DoctorStatus) => updateAvailabilityMutation.mutateAsync(status),
    markNotificationRead: (id: string) => markNotificationReadMutation.mutateAsync(id),
    refetchAll: () => {
      refetchDoctor();
      refetchAppointments();
      refetchCurrentPatient();
      refetchNextPatient();
      refetchQueue();
      refetchNotifications();
    },
  };
}
