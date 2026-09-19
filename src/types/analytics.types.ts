export type AnalyticsTimeRange = 'today' | '7d' | '30d';

export interface AnalyticsKPIs {
  appointmentsCount: number;
  completedConsultations: number;
  waitingPatients: number;
  avgWaitingTimeMinutes: number;
  noShowRate: number; // percentage, e.g. 3.2
  noShowCount: number;
  activeConsultations: number;
  availableDoctors: number;
  totalDoctors: number;
  queueUtilization: number; // percentage, e.g. 74
}

export interface DepartmentMetric {
  departmentId: string;
  departmentName: string;
  count: number;
  completed: number;
  waiting: number;
}

export interface TimeSeriesMetric {
  timeLabel: string; // e.g. "09:00", "Mon 12/09", etc.
  appointments: number;
  completed: number;
  noShows: number;
  avgWaitTime: number;
}

export interface DoctorWorkloadMetric {
  doctorId: string;
  doctorName: string;
  specialization: string;
  completed: number;
  active: number;
  scheduled: number;
  total: number;
}

export interface ServiceUtilizationMetric {
  serviceId: string;
  serviceName: string;
  departmentName: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  timeRange: AnalyticsTimeRange;
  kpis: AnalyticsKPIs;
  appointmentsByDepartment: DepartmentMetric[];
  appointmentsOverTime: TimeSeriesMetric[];
  waitingTimeTrend: TimeSeriesMetric[];
  completedConsultationsTrend: TimeSeriesMetric[];
  noShowTrend: TimeSeriesMetric[];
  doctorWorkload: DoctorWorkloadMetric[];
  serviceUtilization: ServiceUtilizationMetric[];
}
