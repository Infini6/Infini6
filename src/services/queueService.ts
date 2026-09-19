import { apiService } from './api';
import { QueueStatus } from '../types/database.types';
import { EnrichedQueueEntry, QueueFilters } from '../types/queue.types';

export const queueService = {
  async getQueueEntries(hospitalId: string, filters?: QueueFilters): Promise<EnrichedQueueEntry[]> {
    return apiService.getQueueEntries(hospitalId, filters);
  },

  async callNext(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'CALLED', actorId, role);
  },

  async callNextPatient(
    hospitalId: string,
    departmentId?: string,
    doctorId?: string,
    actorId?: string,
    role?: string
  ): Promise<void> {
    await apiService.callNextPatient(hospitalId, departmentId, doctorId, actorId, role);
  },

  async checkInPatient(appointmentId: string, actorId?: string, role?: string) {
    return apiService.checkInPatient(appointmentId, actorId, role);
  },

  async startConsultation(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'IN_PROGRESS', actorId, role);
  },

  async completeConsultation(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'COMPLETED', actorId, role);
  },

  async skipPatient(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'SKIPPED', actorId, role);
  },

  async markNoShow(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'NO_SHOW', actorId, role);
  },

  async cancelQueue(queueId: string, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, 'CANCELLED', actorId, role);
  },

  async transferQueue(
    queueId: string,
    targetDepartmentId: string,
    targetDoctorId?: string,
    actorId?: string,
    role?: string
  ): Promise<void> {
    await apiService.transferPatient(queueId, targetDepartmentId, targetDoctorId, actorId, role);
  },

  async updateStatus(queueId: string, status: QueueStatus, actorId?: string, role?: string): Promise<void> {
    await apiService.updateQueueStatus(queueId, status, actorId, role);
  },
};

