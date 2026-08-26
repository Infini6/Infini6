import { Hospital, Department, Service } from "../types";
import { mockDb } from "./mockDatabase";
import { apiClient } from "./apiClient";

const IS_REMOTE = !!(import.meta as any).env?.VITE_API_BASE_URL;

export const hospitalApi = {
  getHospitals: async (): Promise<Hospital[]> => {
    if (IS_REMOTE) return apiClient.get<Hospital[]>("/hospitals");
    await new Promise((r) => setTimeout(r, 120));
    return [...mockDb.hospitals];
  },

  getHospitalById: async (hospitalId: string): Promise<Hospital> => {
    if (IS_REMOTE) return apiClient.get<Hospital>(`/hospitals/${hospitalId}`);
    await new Promise((r) => setTimeout(r, 100));
    const h = mockDb.hospitals.find((item) => item.id === hospitalId) || mockDb.hospitals[0];
    return { ...h };
  },

  updateHospitalStatus: async (hospitalId: string, status: Hospital["status"]): Promise<Hospital> => {
    if (IS_REMOTE) return apiClient.patch<Hospital>(`/hospitals/${hospitalId}/status`, { status });
    const h = mockDb.hospitals.find((item) => item.id === hospitalId);
    if (h) h.status = status;
    return { ...(h || mockDb.hospitals[0]) };
  },
};

export const departmentApi = {
  getDepartments: async (hospitalId?: string): Promise<Department[]> => {
    if (IS_REMOTE) return apiClient.get<Department[]>("/departments", { hospitalId });
    await new Promise((r) => setTimeout(r, 120));
    return [...mockDb.departments];
  },

  getDepartmentById: async (deptId: string): Promise<Department | undefined> => {
    if (IS_REMOTE) return apiClient.get<Department>(`/departments/${deptId}`);
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.departments.find((d) => d.id === deptId);
  },

  updateDepartment: async (deptId: string, updates: Partial<Department>): Promise<Department> => {
    if (IS_REMOTE) return apiClient.put<Department>(`/departments/${deptId}`, updates);
    const dept = mockDb.departments.find((d) => d.id === deptId);
    if (!dept) throw new Error("Department not found");
    Object.assign(dept, updates);
    return { ...dept };
  },
};

export const serviceApi = {
  getServices: async (departmentId?: string): Promise<Service[]> => {
    if (IS_REMOTE) return apiClient.get<Service[]>("/services", { departmentId });
    await new Promise((r) => setTimeout(r, 100));
    if (departmentId) return mockDb.services.filter((s) => s.departmentId === departmentId);
    return [...mockDb.services];
  },
  
  createService: async (serviceData: Omit<Service, "id">): Promise<Service> => {
    if (IS_REMOTE) return apiClient.post<Service>("/services", serviceData);
    const newService: Service = {
      ...serviceData,
      id: `serv-${Date.now()}`,
    };
    mockDb.services.push(newService);
    return newService;
  },

  updateService: async (serviceId: string, updates: Partial<Service>): Promise<Service> => {
    if (IS_REMOTE) return apiClient.put<Service>(`/services/${serviceId}`, updates);
    const serv = mockDb.services.find((s) => s.id === serviceId);
    if (!serv) throw new Error("Service not found");
    Object.assign(serv, updates);
    return { ...serv };
  },
};
