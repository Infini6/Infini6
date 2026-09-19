// Database Types for Smart Hospital Queue & Navigation System

export type UserRole = 'DOCTOR' | 'HOSPITAL_STAFF' | 'HOSPITAL_ADMIN';

export type QueueStatus = 
  | 'WAITING'
  | 'CALLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'TRANSFERRED';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type DoctorStatus = 
  | 'AVAILABLE' 
  | 'BUSY' 
  | 'ON_BREAK' 
  | 'UNAVAILABLE' 
  | 'ON_LEAVE' 
  | 'OFFLINE';

export type DepartmentStatus = 'ACTIVE' | 'INACTIVE' | 'BUSY';

export type JourneyStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export type JourneyStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type NavigationCategory = 
  | 'CONSULTATION' 
  | 'RADIOLOGY' 
  | 'LABORATORY' 
  | 'PHARMACY' 
  | 'REGISTRATION' 
  | 'COUNTER'
  | 'ROOM'
  | 'DEPARTMENT'
  | 'OTHER';

export interface HospitalRow {
  id: string;
  name: string;
  address: string;
  contact: string;
  operating_hours: Record<string, { open?: string; close?: string; closed?: boolean }>;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  hospital_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentRow {
  id: string;
  hospital_id: string;
  name: string;
  description: string | null;
  location: string;
  floor: string;
  status: DepartmentStatus;
  operating_hours?: { open?: string; close?: string };
  doctor_count?: number;
  service_count?: number;
}

export interface DoctorRow {
  id: string;
  user_id: string;
  hospital_id: string;
  department_id: string;
  specialization: string;
  status: DoctorStatus;
  profile?: ProfileRow;
  department?: DepartmentRow;
  assigned_services?: string[];
}

export interface DoctorScheduleRow {
  id: string;
  doctor_id: string;
  date: string;
  working_days?: string[];
  start_time: string;
  end_time: string;
  break_periods: Array<{ start: string; end: string; reason?: string }>;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_LEAVE' | 'EMERGENCY_DUTY';
}

export interface ServiceRow {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  expected_duration: number; // minutes
  requirements: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';
  department?: DepartmentRow;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  hospital_id: string;
  department_id: string;
  doctor_id: string | null;
  service_id: string | null;
  appointment_date: string;
  expected_start: string;
  expected_end: string;
  recommended_arrival: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  patient_name?: string;
  patient_phone?: string;
  patient_gender?: string;
  patient_age?: number;
  doctor?: DoctorRow;
  department?: DepartmentRow;
  service?: ServiceRow;
}

export interface QueueEntryRow {
  id: string;
  appointment_id: string;
  queue_reference: string;
  position: number;
  status: QueueStatus;
  estimated_wait: number; // minutes
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface JourneyRow {
  id: string;
  appointment_id: string;
  current_step: number;
  status: JourneyStatus;
}

export interface JourneyStepRow {
  id: string;
  journey_id: string;
  name: string;
  location: string;
  step_order: number;
  status: JourneyStepStatus;
}

export interface JourneyTemplateRow {
  id: string;
  hospital_id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  steps?: JourneyTemplateStepRow[];
}

export interface JourneyTemplateStepRow {
  id: string;
  template_id: string;
  name: string;
  location: string;
  navigation_id?: string | null;
  step_order: number;
  expected_duration: number;
  created_at: string;
}

export interface NavigationLocationRow {
  id: string;
  hospital_id: string;
  building: string;
  block: string;
  floor: string;
  room: string;
  counter: string | null;
  category: NavigationCategory;
  name?: string;
  department_id?: string | null;
  department?: DepartmentRow;
  status: 'ACTIVE' | 'INACTIVE';
  coordinates: { x: number; y: number };
  created_at?: string;
  updated_at?: string;
}

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'DOCTOR_UNAVAILABLE'
  | 'QUEUE_UPDATED'
  | 'PATIENT_CALLED'
  | 'JOURNEY_UPDATED'
  | 'HOSPITAL_ANNOUNCEMENT'
  | 'SYSTEM_ALERT';

export interface NotificationRow {
  id: string;
  user_id: string | null;
  hospital_id?: string;
  type: NotificationType | string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name?: string;
  role: string;
  hospital_id: string;
  action: string;
  resource: string;
  status?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
