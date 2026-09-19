import { apiService } from './api';
import { DashboardStats } from '../types/queue.types';
import { AnalyticsTimeRange, AnalyticsData } from '../types/analytics.types';

export const analyticsService = {
  async getDashboardStats(hospitalId: string): Promise<DashboardStats> {
    return apiService.getDashboardStats(hospitalId);
  },

  async getAnalyticsData(hospitalId: string, range: AnalyticsTimeRange = 'today'): Promise<AnalyticsData> {
    return apiService.getAnalyticsData(hospitalId, range);
  },
};
