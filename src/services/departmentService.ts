import { apiService } from './api';
import { DepartmentRow } from '../types/database.types';

export const departmentService = {
  async getDepartments(hospitalId: string) {
    return apiService.getDepartments(hospitalId);
  },

  async getDepartmentById(id: string) {
    return apiService.getDepartmentById(id);
  },

  async createDepartment(dept: Omit<DepartmentRow, 'id'>, actorId?: string) {
    return apiService.createDepartment(dept, actorId);
  },

  async updateDepartment(deptId: string, updates: Partial<DepartmentRow>, actorId?: string) {
    return apiService.updateDepartment(deptId, updates, actorId);
  },

  async deactivateDepartment(deptId: string, actorId?: string) {
    return apiService.deactivateDepartment(deptId, actorId);
  },
};
