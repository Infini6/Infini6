import { apiService } from './api';
import { DoctorStatus, DoctorScheduleRow } from '../types/database.types';
import { EnrichedQueueEntry } from '../types/queue.types';

export const doctorService = {
  async getDoctors(hospitalId: string) {
    return apiService.getDoctors(hospitalId);
  },

  async getDoctorByUserId(userId: string) {
    return apiService.getDoctorByUserId(userId);
  },

  async getDoctorAppointments(hospitalId: string, doctorId: string, date?: string) {
    return apiService.getDoctorAppointments(hospitalId, doctorId, date);
  },

  async getDoctorQueueEntries(hospitalId: string, doctorId: string): Promise<EnrichedQueueEntry[]> {
    return apiService.getDoctorQueueEntries(hospitalId, doctorId);
  },

  async getDoctorCurrentPatient(hospitalId: string, doctorId: string) {
    return apiService.getDoctorCurrentPatient(hospitalId, doctorId);
  },

  async getDoctorNextPatient(hospitalId: string, doctorId: string): Promise<EnrichedQueueEntry | null> {
    return apiService.getDoctorNextPatient(hospitalId, doctorId);
  },

  async updateDoctorSelfAvailability(doctorId: string, status: DoctorStatus, actorId?: string) {
    return apiService.updateDoctorSelfAvailability(doctorId, status, actorId);
  },

  async executeDoctorConsultationAction(
    queueId: string,
    action: 'CALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW',
    doctorId: string,
    actorId?: string
  ) {
    return apiService.executeDoctorConsultationAction(queueId, action, doctorId, actorId);
  },

  async createDoctor(
    payload: {
      name: string;
      email: string;
      phone: string;
      department_id: string;
      specialization: string;
      status: DoctorStatus;
      hospital_id: string;
    },
    actorId?: string
  ) {
    return apiService.createDoctor(payload, actorId);
  },

  async updateDoctor(
    doctorId: string,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      department_id: string;
      specialization: string;
      status: DoctorStatus;
      assigned_services: string[];
    }>,
    actorId?: string
  ) {
    return apiService.updateDoctor(doctorId, payload, actorId);
  },

  async updateDoctorStatus(doctorId: string, status: DoctorStatus, actorId?: string) {
    return apiService.updateDoctorStatus(doctorId, status, actorId);
  },

  async deactivateDoctor(doctorId: string, actorId?: string) {
    return apiService.deactivateDoctor(doctorId, actorId);
  },

  async getDoctorSchedule(doctorId: string) {
    return apiService.getDoctorSchedule(doctorId);
  },

  async saveDoctorSchedule(
    doctorId: string,
    schedule: Omit<DoctorScheduleRow, 'id' | 'doctor_id'>,
    actorId?: string
  ) {
    return apiService.saveDoctorSchedule(doctorId, schedule, actorId);
  },
};
