// Centralized TanStack Query Keys

export const queryKeys = {
  hospitals: {
    all: ['hospitals'] as const,
    detail: (id: string) => ['hospitals', id] as const,
  },
  departments: {
    all: (hospitalId: string) => ['departments', { hospitalId }] as const,
    detail: (id: string) => ['departments', 'detail', id] as const,
  },
  doctors: {
    all: (hospitalId: string) => ['doctors', { hospitalId }] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    byUser: (userId: string) => ['doctors', 'byUser', userId] as const,
    schedule: (doctorId: string, date?: string) => ['doctors', 'schedule', doctorId, date] as const,
    appointments: (doctorId: string) => ['doctors', 'appointments', doctorId] as const,
    currentPatient: (doctorId: string) => ['doctors', 'currentPatient', doctorId] as const,
    nextPatient: (doctorId: string) => ['doctors', 'nextPatient', doctorId] as const,
  },
  services: {
    all: (hospitalId: string) => ['services', { hospitalId }] as const,
    byDepartment: (deptId: string) => ['services', { deptId }] as const,
  },
  appointments: {
    all: (hospitalId: string, filters?: Record<string, unknown>) => 
      ['appointments', { hospitalId, ...filters }] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    today: (hospitalId: string) => ['appointments', 'today', hospitalId] as const,
  },
  queue: {
    all: (hospitalId: string, filters?: Record<string, unknown>) => 
      ['queue', { hospitalId, ...filters }] as const,
    live: (hospitalId: string) => ['queue', 'live', hospitalId] as const,
    detail: (id: string) => ['queue', 'detail', id] as const,
  },
  journeys: {
    byAppointment: (appointmentId: string) => ['journeys', 'appointment', appointmentId] as const,
  },
  navigation: {
    all: (hospitalId: string) => ['navigation', { hospitalId }] as const,
  },
  dashboard: {
    stats: (hospitalId: string) => ['dashboard', 'stats', hospitalId] as const,
  },
  analytics: {
    stats: (hospitalId: string, range: string) => ['analytics', 'stats', hospitalId, range] as const,
  },
  notifications: {
    all: (userId: string, hospitalId?: string) => ['notifications', userId, hospitalId] as const,
  },
  auditLogs: {
    all: (hospitalId: string) => ['audit_logs', hospitalId] as const,
  },
  disruptions: {
    all: (hospitalId: string) => ['doctor_disruptions', hospitalId] as const,
    alternatives: (appointmentId: string) => ['doctor_disruptions', 'alternatives', appointmentId] as const,
  },
};
