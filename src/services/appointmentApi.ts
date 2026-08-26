import { Appointment, AppointmentStatus, QueueEntry } from "../types";
import { mockDb } from "./mockDatabase";
import { apiClient } from "./apiClient";

const IS_REMOTE = !!(import.meta as any).env?.VITE_API_BASE_URL;

export interface AppointmentFilters {
  date?: string;
  departmentId?: string;
  doctorId?: string;
  status?: AppointmentStatus | "ALL";
  search?: string;
  priorityLevel?: string;
}

export const appointmentApi = {
  getAppointments: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    if (IS_REMOTE) return apiClient.get<Appointment[]>("/appointments", filters);
    await new Promise((r) => setTimeout(r, 150));
    let list = [...mockDb.appointments];

    if (filters?.departmentId && filters.departmentId !== "ALL") {
      list = list.filter((a) => a.departmentId === filters.departmentId);
    }
    if (filters?.doctorId && filters.doctorId !== "ALL") {
      list = list.filter((a) => a.doctorId === filters.doctorId);
    }
    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.date) {
      list = list.filter((a) => a.appointmentDate === filters.date);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.referenceNumber.toLowerCase().includes(q) ||
          a.patientMrn.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q)
      );
    }

    return list;
  },

  getAppointmentById: async (appointmentId: string): Promise<Appointment | undefined> => {
    if (IS_REMOTE) return apiClient.get<Appointment>(`/appointments/${appointmentId}`);
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.appointments.find((a) => a.id === appointmentId);
  },

  checkInPatient: async (
    appointmentId: string,
    priorityLevel: "NORMAL" | "PRIORITY" | "ELDERLY" = "NORMAL",
    actorName?: string
  ): Promise<{ appointment: Appointment; queueEntry: QueueEntry }> => {
    if (IS_REMOTE) {
      return apiClient.post<{ appointment: Appointment; queueEntry: QueueEntry }>(
        `/appointments/${appointmentId}/check-in`,
        { priorityLevel }
      );
    }
    await new Promise((r) => setTimeout(r, 200));
    const result = mockDb.checkInAppointment(appointmentId, priorityLevel, actorName);
    if (!result) throw new Error("Appointment not found or check-in failed");
    return result;
  },

  reassignDoctor: async (
    appointmentId: string,
    newDoctorId: string,
    newTimeSlot?: string,
    actorName?: string
  ): Promise<Appointment> => {
    if (IS_REMOTE) {
      return apiClient.post<Appointment>(`/appointments/${appointmentId}/reassign`, {
        newDoctorId,
        newTimeSlot,
      });
    }
    await new Promise((r) => setTimeout(r, 200));
    const result = mockDb.reassignAppointment(appointmentId, newDoctorId, newTimeSlot, actorName);
    if (!result) throw new Error("Reassignment failed");
    return result;
  },

  reschedule: async (
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string,
    actorName?: string
  ): Promise<Appointment> => {
    if (IS_REMOTE) {
      return apiClient.post<Appointment>(`/appointments/${appointmentId}/reschedule`, {
        newDate,
        newTime,
        reason,
      });
    }
    await new Promise((r) => setTimeout(r, 200));
    const result = mockDb.rescheduleAppointment(appointmentId, newDate, newTime, reason, actorName);
    if (!result) throw new Error("Reschedule failed");
    return result;
  },
};
