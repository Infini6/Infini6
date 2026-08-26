import {
  QueueEntry,
  Doctor,
  Appointment,
  PatientJourney,
  OperationalAlert,
} from "../types";

export type WebSocketEventType =
  | "QUEUE_UPDATED"
  | "PATIENT_CHECKED_IN"
  | "PATIENT_CALLED"
  | "CONSULTATION_STARTED"
  | "CONSULTATION_COMPLETED"
  | "PATIENT_SKIPPED"
  | "PATIENT_NO_SHOW"
  | "DOCTOR_AVAILABLE"
  | "DOCTOR_UNAVAILABLE"
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED"
  | "JOURNEY_UPDATED"
  | "SYSTEM_ALERT_CREATED"
  | "HOSPITAL_STATUS_CHANGED";

export interface WebSocketEventPayload<T = unknown> {
  type: WebSocketEventType;
  hospitalId: string;
  departmentId?: string;
  doctorId?: string;
  appointmentId?: string;
  timestamp: string;
  data: T;
}

export type QueueUpdatedPayload = WebSocketEventPayload<{
  departmentId: string;
  queueEntry: QueueEntry;
  action: "CHECK_IN" | "CALL" | "START" | "COMPLETE" | "SKIP" | "NO_SHOW" | "TRANSFER";
}>;

export type DoctorStatusPayload = WebSocketEventPayload<{
  doctor: Doctor;
  affectedAppointmentsCount?: number;
}>;

export type JourneyUpdatedPayload = WebSocketEventPayload<{
  journey: PatientJourney;
}>;

export type AlertPayload = WebSocketEventPayload<{
  alert: OperationalAlert;
}>;

export type AppointmentPayload = WebSocketEventPayload<{
  appointment: Appointment;
}>;
