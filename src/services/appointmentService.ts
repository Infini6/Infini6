import { apiService } from './api';
import { AppointmentRow } from '../types/database.types';

export const appointmentService = {
  async getAppointments(
    hospitalId: string,
    filtersOrDate?:
      | string
      | {
          date?: string;
          tab?: 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW' | 'ALL';
          departmentId?: string;
          doctorId?: string;
          serviceId?: string;
          status?: string;
          search?: string;
        }
  ) {
    const filters = typeof filtersOrDate === 'string' ? { date: filtersOrDate } : filtersOrDate;
    return apiService.getAppointments(hospitalId, filters);
  },

  async getAppointmentById(id: string) {
    return apiService.getAppointmentById(id);
  },

  async updateAppointment(id: string, updates: Partial<AppointmentRow>, actorId?: string) {
    return apiService.updateAppointment(id, updates, actorId);
  },

  async updateStatus(id: string, status: AppointmentRow['status'], actorId?: string) {
    return apiService.updateAppointment(id, { status }, actorId);
  },

  async getDoctorUnavailableDisruptions(hospitalId: string) {
    return apiService.getDoctorUnavailableDisruptions(hospitalId);
  },

  async getBackendRescheduleAlternatives(appointmentId: string) {
    return apiService.getBackendRescheduleAlternatives(appointmentId);
  },

  async reassignOrRescheduleAppointment(
    payload: import('../types/disruption.types').RescheduleActionPayload,
    actorId?: string,
    actorRole?: string
  ) {
    return apiService.reassignOrRescheduleAppointment(payload, actorId, actorRole);
  },
};

