import { 
  AppointmentRow, 
  DoctorRow, 
  DepartmentRow, 
  DoctorStatus, 
  QueueEntryRow 
} from './database.types';

export interface BackendRescheduleAlternatives {
  appointmentId: string;
  recommendedDoctor: DoctorRow | null;
  recommendedDate: string;
  recommendedTime: string;
  alternativeDoctors: {
    doctor: DoctorRow;
    availableSlots: string[];
  }[];
  alternativeDates: {
    date: string;
    availableDoctors: DoctorRow[];
  }[];
  operatingHours: {
    open: string;
    close: string;
  };
  reasonSummary: string;
}

export interface AffectedAppointmentItem extends AppointmentRow {
  queue_entry?: QueueEntryRow | null;
  alternatives?: BackendRescheduleAlternatives;
  isResolved?: boolean;
  resolvedAt?: string;
  resolutionType?: string;
}

export interface DoctorDisruptionIncident {
  incidentId: string;
  doctor: DoctorRow;
  unavailablePeriod: string;
  status: DoctorStatus;
  department: DepartmentRow;
  totalAffected: number;
  pendingCount: number;
  resolvedCount: number;
  affectedAppointments: AffectedAppointmentItem[];
}

export interface RescheduleActionPayload {
  appointmentId: string;
  actionType: 'CONFIRM_ALTERNATIVE' | 'REASSIGN_DOCTOR' | 'CHANGE_TIME' | 'RESCHEDULE_DATE' | 'CANCEL';
  targetDoctorId?: string;
  targetDate?: string;
  targetTime?: string;
  cancellationReason?: string;
}

export interface RescheduleResult {
  success: boolean;
  appointment: AppointmentRow;
  message: string;
  auditLogId?: string;
}
