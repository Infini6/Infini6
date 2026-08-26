import { QueueEntry, QueueStatus } from "../types";
import { mockDb } from "./mockDatabase";
import { apiClient } from "./apiClient";

const IS_REMOTE = !!(import.meta as any).env?.VITE_API_BASE_URL;

export const queueApi = {
  getQueueEntries: async (params?: {
    departmentId?: string;
    doctorId?: string;
    status?: QueueStatus | "ACTIVE_ONLY";
  }): Promise<QueueEntry[]> => {
    if (IS_REMOTE) return apiClient.get<QueueEntry[]>("/queue", params);
    await new Promise((r) => setTimeout(r, 120));
    let list = [...mockDb.queues];

    if (params?.departmentId && params.departmentId !== "ALL") {
      list = list.filter((q) => q.departmentId === params.departmentId);
    }
    if (params?.doctorId && params.doctorId !== "ALL") {
      list = list.filter((q) => q.doctorId === params.doctorId);
    }
    if (params?.status === "ACTIVE_ONLY") {
      list = list.filter((q) => q.status === "WAITING" || q.status === "CALLED" || q.status === "IN_PROGRESS");
    } else if (params?.status) {
      list = list.filter((q) => q.status === params.status);
    }

    return list;
  },

  callNext: async (
    departmentId: string,
    doctorId?: string,
    actorName?: string
  ): Promise<QueueEntry | null> => {
    if (IS_REMOTE) {
      return apiClient.post<QueueEntry>("/queue/call-next", { departmentId, doctorId });
    }
    await new Promise((r) => setTimeout(r, 250));
    return mockDb.callNextPatient(departmentId, doctorId, actorName);
  },

  updateStatus: async (
    queueId: string,
    status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "NO_SHOW" | "CANCELLED" | "TRANSFERRED",
    actorName?: string,
    transferDeptId?: string
  ): Promise<QueueEntry> => {
    if (IS_REMOTE) {
      return apiClient.patch<QueueEntry>(`/queue/${queueId}/status`, {
        status,
        transferDeptId,
      });
    }
    await new Promise((r) => setTimeout(r, 200));
    const res = mockDb.updateQueueStatus(queueId, status, actorName, transferDeptId);
    if (!res) throw new Error("Queue entry not found");
    return res;
  },
};
