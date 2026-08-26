export type StaffRole =
  | "HOSPITAL_ADMIN"
  | "RECEPTION_STAFF"
  | "DOCTOR"
  | "QUEUE_OPERATOR"
  | "DEPARTMENT_STAFF";

export type Permission =
  | "APPOINTMENT_VIEW"
  | "APPOINTMENT_MANAGE"
  | "QUEUE_VIEW"
  | "QUEUE_MANAGE"
  | "DOCTOR_VIEW"
  | "DOCTOR_MANAGE"
  | "PATIENT_VIEW"
  | "HOSPITAL_MANAGE"
  | "ANALYTICS_VIEW"
  | "NAVIGATION_MANAGE"
  | "JOURNEY_CONFIG";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: StaffRole;
  hospitalId: string;
  hospitalName: string;
  departmentId?: string;
  departmentName?: string;
  doctorId?: string;
  avatarUrl?: string;
  phone?: string;
  permissions: Permission[];
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  contactNumber: string;
  emergencyNumber: string;
  operatingHours: string;
  status: "ACTIVE" | "MAINTENANCE" | "EMERGENCY_ONLY" | "CLOSED";
  timezone: string;
  totalBeds: number;
  availableBeds: number;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  description: string;
  building: string;
  block: string;
  floor: string;
  roomNumber: string;
  headDoctorId?: string;
  status: "ACTIVE" | "DELAYED" | "OVERLOADED" | "CLOSED";
  averageWaitTimeMinutes: number;
  activeCounters: number;
  activeDoctorsCount: number;
  totalWaitingCount: number;
}

export type DoctorAvailabilityStatus =
  | "AVAILABLE"
  | "IN_CONSULTATION"
  | "ON_BREAK"
  | "UNAVAILABLE"
  | "ON_LEAVE";

export interface Doctor {
  id: string;
  staffId: string;
  userId?: string;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  name: string;
  qualification: string;
  specialization: string;
  roomNumber: string;
  availability: DoctorAvailabilityStatus;
  statusMessage?: string;
  currentPatientToken?: string;
  currentPatientName?: string;
  patientsServedToday: number;
  patientsWaitingCount: number;
  avgConsultationMinutes: number;
  workingHours: string;
  unavailableReason?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isAvailable: boolean;
  notes?: string;
}

export interface Service {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  code: string;
  description: string;
  expectedDurationMinutes: number;
  requiresScan: boolean;
  requiresLab: boolean;
  preparationInstructions?: string;
  status: "ACTIVE" | "INACTIVE";
}

export type AppointmentStatus =
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CALLED"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW"
  | "DELAYED";

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  email?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string[];
}

export interface Appointment {
  id: string;
  referenceNumber: string;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientMrn: string;
  appointmentDate: string;
  expectedStartTime: string;
  expectedEndTime: string;
  recommendedArrivalTime: string;
  checkedInAt?: string;
  status: AppointmentStatus;
  queueToken?: string;
  queuePosition?: number;
  priorityLevel: "NORMAL" | "PRIORITY" | "ELDERLY" | "STAFF_OVERRIDE";
  notes?: string;
  affectedByDoctorAbsence?: boolean;
}

export type QueueStatus =
  | "WAITING"
  | "CALLED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "NO_SHOW"
  | "CANCELLED"
  | "TRANSFERRED";

export interface QueueEntry {
  id: string;
  appointmentId: string;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  serviceName: string;
  tokenNumber: string;
  position: number;
  patientId: string;
  patientName: string;
  patientMrn: string;
  status: QueueStatus;
  checkedInAt: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedWaitMinutes: number;
  roomNumber: string;
  priority: "NORMAL" | "PRIORITY" | "ELDERLY";
  notes?: string;
}

export type JourneyStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export interface JourneyStep {
  id: string;
  name: string;
  location: string;
  order: number;
  status: JourneyStepStatus;
  departmentName: string;
  roomNumber: string;
  completedAt?: string;
  notes?: string;
}

export interface PatientJourney {
  id: string;
  appointmentId: string;
  patientName: string;
  patientMrn: string;
  serviceName: string;
  currentStepIndex: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  steps: JourneyStep[];
  currentLocation: string;
  nextDestination: string;
  updatedAt: string;
}

export interface NavigationLocation {
  id: string;
  hospitalId: string;
  name: string;
  type: "COUNTER" | "CONSULTATION_ROOM" | "RADIOLOGY" | "LABORATORY" | "PHARMACY" | "WAITING_AREA" | "EMERGENCY" | "HELP_DESK";
  building: string;
  block: string;
  floor: string;
  room: string;
  counter?: string;
  directions: string;
  coordinates?: { x: number; y: number };
}

export interface NotificationItem {
  id: string;
  userId?: string;
  hospitalId: string;
  type: "DOCTOR_UNAVAILABLE" | "QUEUE_DELAY" | "PATIENT_CHECKED_IN" | "PATIENT_CALLED" | "APPOINTMENT_CONFLICT" | "SYSTEM_ALERT" | "CAPACITY_WARNING";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface OperationalAlert {
  id: string;
  hospitalId: string;
  departmentId?: string;
  departmentName?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  actionRequired?: string;
  actionRoute?: string;
  affectedCount?: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  role: StaffRole;
  hospitalId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
}

export interface DepartmentWorkload {
  departmentId: string;
  departmentName: string;
  totalToday: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  avgWaitTime: number;
  status: "NORMAL" | "DELAYED" | "OVERLOADED";
  doctorsOnDuty: number;
}

export interface OperationsSummary {
  todayAppointmentsCount: number;
  waitingCount: number;
  inConsultationCount: number;
  completedCount: number;
  delayedCount: number;
  noShowCount: number;
  availableDoctorsCount: number;
  totalDoctorsCount: number;
  averageWaitTimeMinutes: number;
  queueFairnessScore: number; // 0-100 index
  activeAlertsCount: number;
}
