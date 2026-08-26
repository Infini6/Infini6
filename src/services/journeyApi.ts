import {
  PatientJourney,
  NavigationLocation,
  OperationsSummary,
  DepartmentWorkload,
  OperationalAlert,
  NotificationItem,
  AuditLogItem,
} from "../types";
import { mockDb } from "./mockDatabase";
import { apiClient } from "./apiClient";

const IS_REMOTE = !!(import.meta as any).env?.VITE_API_BASE_URL;

export const journeyApi = {
  getJourneyByAppointmentId: async (appointmentId: string): Promise<PatientJourney | undefined> => {
    if (IS_REMOTE) return apiClient.get<PatientJourney>(`/journey/${appointmentId}`);
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.journeys[appointmentId];
  },

  getAllActiveJourneys: async (): Promise<PatientJourney[]> => {
    if (IS_REMOTE) return apiClient.get<PatientJourney[]>("/journey");
    await new Promise((r) => setTimeout(r, 120));
    return Object.values(mockDb.journeys);
  },

  advanceJourneyStep: async (
    appointmentId: string,
    stepIndex: number,
    status: "COMPLETED" | "IN_PROGRESS" | "SKIPPED"
  ): Promise<PatientJourney> => {
    if (IS_REMOTE) {
      return apiClient.patch<PatientJourney>(`/journey/${appointmentId}/steps/${stepIndex}`, { status });
    }
    const jrn = mockDb.journeys[appointmentId];
    if (!jrn) throw new Error("Journey not found");
    if (jrn.steps[stepIndex]) {
      jrn.steps[stepIndex].status = status;
      if (status === "COMPLETED") {
        jrn.steps[stepIndex].completedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        jrn.currentStepIndex = Math.min(stepIndex + 1, jrn.steps.length - 1);
        if (jrn.steps[jrn.currentStepIndex]) {
          jrn.steps[jrn.currentStepIndex].status = "IN_PROGRESS";
          jrn.currentLocation = jrn.steps[jrn.currentStepIndex].location;
          jrn.nextDestination = jrn.steps[Math.min(jrn.currentStepIndex + 1, jrn.steps.length - 1)].name;
        }
      }
    }
    return { ...jrn };
  },
};

export const navigationApi = {
  getNavigationLocations: async (hospitalId?: string): Promise<NavigationLocation[]> => {
    if (IS_REMOTE) return apiClient.get<NavigationLocation[]>("/navigation", { hospitalId });
    await new Promise((r) => setTimeout(r, 120));
    return [...mockDb.navigations];
  },

  saveLocation: async (location: Omit<NavigationLocation, "id"> & { id?: string }): Promise<NavigationLocation> => {
    if (IS_REMOTE) return apiClient.post<NavigationLocation>("/navigation", location);
    if (location.id) {
      const idx = mockDb.navigations.findIndex((n) => n.id === location.id);
      if (idx >= 0) {
        mockDb.navigations[idx] = location as NavigationLocation;
        return mockDb.navigations[idx];
      }
    }
    const newLoc: NavigationLocation = {
      ...location,
      id: `nav-${Date.now()}`,
    };
    mockDb.navigations.push(newLoc);
    return newLoc;
  },
};

export const operationsApi = {
  getSummary: async (): Promise<OperationsSummary> => {
    if (IS_REMOTE) return apiClient.get<OperationsSummary>("/operations/summary");
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.getOperationsSummary();
  },

  getDepartmentWorkloads: async (): Promise<DepartmentWorkload[]> => {
    if (IS_REMOTE) return apiClient.get<DepartmentWorkload[]>("/operations/departments");
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.getDepartmentWorkloads();
  },

  getAlerts: async (): Promise<OperationalAlert[]> => {
    if (IS_REMOTE) return apiClient.get<OperationalAlert[]>("/operations/alerts");
    await new Promise((r) => setTimeout(r, 80));
    return [...mockDb.alerts];
  },

  resolveAlert: async (alertId: string): Promise<OperationalAlert> => {
    if (IS_REMOTE) return apiClient.patch<OperationalAlert>(`/operations/alerts/${alertId}/resolve`, {});
    const alert = mockDb.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
    return { ...(alert || mockDb.alerts[0]) };
  },

  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    if (IS_REMOTE) return apiClient.get<AuditLogItem[]>("/operations/audit-logs");
    await new Promise((r) => setTimeout(r, 100));
    return [...mockDb.auditLogs];
  },
};

export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    if (IS_REMOTE) return apiClient.get<NotificationItem[]>("/notifications");
    await new Promise((r) => setTimeout(r, 80));
    return [...mockDb.notifications];
  },

  markAsRead: async (id: string): Promise<void> => {
    if (IS_REMOTE) return apiClient.patch<void>(`/notifications/${id}/read`, {});
    const n = mockDb.notifications.find((item) => item.id === id);
    if (n) n.read = true;
  },

  markAllAsRead: async (): Promise<void> => {
    if (IS_REMOTE) return apiClient.post<void>("/notifications/read-all", {});
    mockDb.notifications.forEach((n) => (n.read = true));
  },
};

export const analyticsApi = {
  getAnalyticsOverview: async () => {
    if (IS_REMOTE) return apiClient.get<any>("/analytics");
    await new Promise((r) => setTimeout(r, 150));
    return {
      departmentVolume: [
        { name: "Cardiology", appointments: 34, completed: 28, waiting: 6 },
        { name: "Neurology", appointments: 28, completed: 12, waiting: 16 },
        { name: "Pediatrics", appointments: 22, completed: 17, waiting: 5 },
        { name: "Orthopedics", appointments: 19, completed: 12, waiting: 7 },
        { name: "Radiology", appointments: 31, completed: 19, waiting: 12 },
        { name: "Gen Med", appointments: 42, completed: 33, waiting: 9 },
      ],
      hourlyThroughput: [
        { time: "08:00", patients: 12, waitAvg: 8 },
        { time: "09:00", patients: 28, waitAvg: 14 },
        { time: "10:00", patients: 45, waitAvg: 22 },
        { time: "11:00", patients: 38, waitAvg: 26 },
        { time: "12:00", patients: 20, waitAvg: 18 },
        { time: "13:00", patients: 24, waitAvg: 15 },
        { time: "14:00", patients: 32, waitAvg: 19 },
      ],
      doctorEfficiency: [
        { name: "Dr. S. Mitchell", department: "Cardiology", served: 14, avgMinutes: 14, satisfaction: "98%" },
        { name: "Dr. A. Mercer", department: "Cardiology", served: 12, avgMinutes: 16, satisfaction: "96%" },
        { name: "Dr. E. Rostova", department: "Neurology", served: 9, avgMinutes: 22, satisfaction: "94%" },
        { name: "Dr. K. Patel", department: "Pediatrics", served: 18, avgMinutes: 12, satisfaction: "99%" },
        { name: "Dr. S. Reed", department: "Orthopedics", served: 11, avgMinutes: 18, satisfaction: "97%" },
      ],
      kpis: {
        totalPatientsToday: 176,
        avgWaitOverall: "18.4 min",
        noShowRate: "3.2%",
        onTimePerformance: "91.8%",
        queueFairnessIndex: "94 / 100",
      },
    };
  },
};
