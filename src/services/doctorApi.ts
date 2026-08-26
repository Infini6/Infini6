import { Doctor, Appointment, DoctorAvailabilityStatus } from "../types";
import { mockDb } from "./mockDatabase";
import { apiClient } from "./apiClient";

const IS_REMOTE = !!(import.meta as any).env?.VITE_API_BASE_URL;

export const doctorApi = {
  getDoctors: async (params?: { departmentId?: string; availability?: string }): Promise<Doctor[]> => {
    if (IS_REMOTE) return apiClient.get<Doctor[]>("/doctors", params);
    await new Promise((r) => setTimeout(r, 120));
    let list = [...mockDb.doctors];
    if (params?.departmentId) {
      list = list.filter((d) => d.departmentId === params.departmentId);
    }
    if (params?.availability) {
      list = list.filter((d) => d.availability === params.availability);
    }
    return list;
  },

  getDoctorById: async (doctorId: string): Promise<Doctor | undefined> => {
    if (IS_REMOTE) return apiClient.get<Doctor>(`/doctors/${doctorId}`);
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.doctors.find((d) => d.id === doctorId);
  },

  setAvailability: async (
    doctorId: string,
    availability: DoctorAvailabilityStatus,
    reason?: string,
    actorName?: string
  ): Promise<{ doctor: Doctor; affectedAppointments: Appointment[] }> => {
    if (IS_REMOTE) {
      return apiClient.post<{ doctor: Doctor; affectedAppointments: Appointment[] }>(
        `/doctors/${doctorId}/availability`,
        { availability, reason }
      );
    }
    await new Promise((r) => setTimeout(r, 200));
    const result = mockDb.setDoctorAvailability(doctorId, availability, reason, actorName);
    if (!result) throw new Error("Doctor not found");
    return result;
  },

  getAffectedAppointments: async (doctorId: string): Promise<Appointment[]> => {
    if (IS_REMOTE) return apiClient.get<Appointment[]>(`/doctors/${doctorId}/affected-appointments`);
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.appointments.filter(
      (a) => a.doctorId === doctorId && (a.status === "CONFIRMED" || a.status === "CHECKED_IN" || a.status === "DELAYED")
    );
  },

  addDoctor: async (doctorData: Omit<Doctor, "id">): Promise<Doctor> => {
    if (IS_REMOTE) return apiClient.post<Doctor>("/doctors", doctorData);
    const newDoc: Doctor = {
      ...doctorData,
      id: `doc-${Date.now()}`,
    };
    mockDb.doctors.push(newDoc);
    return newDoc;
  },
};
