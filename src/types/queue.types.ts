import { 
  QueueEntryRow, 
  AppointmentRow, 
  DepartmentRow, 
  DoctorRow, 
  ProfileRow, 
  ServiceRow,
  JourneyRow,
  JourneyStepRow,
  QueueStatus 
} from './database.types';

export interface EnrichedQueueEntry extends QueueEntryRow {
  appointment?: AppointmentRow & {
    department?: DepartmentRow;
    doctor?: DoctorRow & { profile?: ProfileRow };
    service?: ServiceRow;
    journey?: JourneyRow & { steps?: JourneyStepRow[] };
    patient_name?: string;
    patient_phone?: string;
    patient_gender?: string;
    patient_age?: number;
  };
}

export interface QueueFilters {
  departmentId?: string;
  doctorId?: string;
  status?: QueueStatus | 'ALL';
  searchQuery?: string;
}

export interface DashboardStats {
  todayAppointments: number;
  waitingPatients: number;
  activeQueues: number;
  availableDoctors: number;
  unavailableDoctors: number;
  activeConsultations: number;
  completedConsultations: number;
  noShows: number;
  avgWaitingTimeMinutes: number;
  departmentWorkload: Array<{
    departmentName: string;
    total: number;
    waiting: number;
    inProgress: number;
    completed: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    message: string;
    timestamp: string;
  }>;
}
