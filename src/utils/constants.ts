import { QueueStatus, AppointmentStatus, DoctorStatus, UserRole, NavigationCategory } from '../types/database.types';

export const QUEUE_STATUS_CONFIG: Record<
  QueueStatus, 
  { label: string; bg: string; text: string; border: string; ring: string }
> = {
  WAITING: {
    label: 'Waiting',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'ring-amber-600/20',
  },
  CALLED: {
    label: 'Called (Proceed)',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-600/20',
  },
  IN_PROGRESS: {
    label: 'In Consultation',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-600/20',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    ring: 'ring-slate-600/20',
  },
  SKIPPED: {
    label: 'Skipped',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    ring: 'ring-orange-600/20',
  },
  NO_SHOW: {
    label: 'No-Show',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'ring-rose-600/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    ring: 'ring-zinc-600/20',
  },
  TRANSFERRED: {
    label: 'Transferred',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    ring: 'ring-purple-600/20',
  },
};

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string }
> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-700' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-700' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-teal-50', text: 'text-teal-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700' },
  NO_SHOW: { label: 'No-Show', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export const DOCTOR_STATUS_CONFIG: Record<
  DoctorStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  AVAILABLE: {
    label: 'Available',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  BUSY: {
    label: 'In Consultation',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50',
    text: 'text-blue-700',
  },
  ON_BREAK: {
    label: 'On Break',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50',
    text: 'text-amber-700',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50',
    text: 'text-rose-700',
  },
  ON_LEAVE: {
    label: 'On Leave',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50',
    text: 'text-purple-700',
  },
  OFFLINE: {
    label: 'Off Duty (Inactive)',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100',
    text: 'text-slate-600',
  },
};

export const ROLE_BADGE_CONFIG: Record<
  UserRole,
  { label: string; bg: string; text: string; icon: string }
> = {
  HOSPITAL_ADMIN: {
    label: 'Hospital Admin',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: 'Shield',
  },
  HOSPITAL_STAFF: {
    label: 'Hospital Staff',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: 'UserCheck',
  },
  DOCTOR: {
    label: 'Doctor',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: 'Stethoscope',
  },
};

export const NAVIGATION_CATEGORY_CONFIG: Record<
  NavigationCategory,
  { label: string; bg: string; text: string }
> = {
  CONSULTATION: { label: 'Consultation Room', bg: 'bg-blue-50', text: 'text-blue-700' },
  RADIOLOGY: { label: 'Radiology & Scans', bg: 'bg-purple-50', text: 'text-purple-700' },
  LABORATORY: { label: 'Laboratory / Diagnostics', bg: 'bg-teal-50', text: 'text-teal-700' },
  PHARMACY: { label: 'Central Pharmacy', bg: 'bg-amber-50', text: 'text-amber-700' },
  REGISTRATION: { label: 'Registration & Triage', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  COUNTER: { label: 'Counter Desk', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  ROOM: { label: 'Clinical Room', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  DEPARTMENT: { label: 'Department Zone', bg: 'bg-rose-50', text: 'text-rose-700' },
  OTHER: { label: 'General Facility', bg: 'bg-slate-100', text: 'text-slate-700' },
};
