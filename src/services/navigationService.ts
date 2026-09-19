import { apiService } from './api';
import { NavigationLocationRow } from '../types/database.types';

export const navigationService = {
  async getLocations(hospitalId: string) {
    return apiService.getNavigationLocations(hospitalId);
  },

  async createLocation(location: Omit<NavigationLocationRow, 'id'>, actorId?: string) {
    return apiService.createNavigationLocation(location, actorId);
  },

  async updateLocation(locId: string, updates: Partial<NavigationLocationRow>, actorId?: string) {
    return apiService.updateNavigationLocation(locId, updates, actorId);
  },

  async toggleLocationStatus(locId: string, status: 'ACTIVE' | 'INACTIVE', actorId?: string) {
    return apiService.toggleNavigationLocationStatus(locId, status, actorId);
  },

  async deleteLocation(locId: string, actorId?: string) {
    return apiService.deleteNavigationLocation(locId, actorId);
  },
};
