import { z } from 'zod';

export const doctorFormSchema = z.object({
  name: z.string().min(2, 'Doctor name must be at least 2 characters'),
  email: z.string().email('Please provide a valid official email'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  department_id: z.string().min(1, 'Please select a primary department'),
  specialization: z.string().min(2, 'Specialization is required (e.g. Senior Obstetrician)'),
  status: z.enum(['AVAILABLE', 'BUSY', 'ON_BREAK', 'UNAVAILABLE', 'ON_LEAVE', 'OFFLINE']),
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export const doctorScheduleFormSchema = z.object({
  working_days: z.array(z.string()).min(1, 'Select at least one working day'),
  start_time: z.string().min(4, 'Shift start time required (e.g. 08:30)'),
  end_time: z.string().min(4, 'Shift end time required (e.g. 16:30)'),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
  availability_status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'ON_LEAVE', 'EMERGENCY_DUTY']),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time;
  }
  return true;
}, {
  message: 'Shift end time must be after start time',
  path: ['end_time'],
});

export type DoctorScheduleFormValues = z.infer<typeof doctorScheduleFormSchema>;

export const departmentFormSchema = z.object({
  name: z.string().min(3, 'Department name must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().min(2, 'Location is required (e.g. Wing North)'),
  floor: z.string().min(1, 'Floor designation required (e.g. Floor 2)'),
  open_time: z.string().default('08:00'),
  close_time: z.string().default('20:00'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BUSY']).default('ACTIVE'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const serviceFormSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  department_id: z.string().min(1, 'Please select an assigned department'),
  expected_duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes').max(240, 'Max 240 minutes'),
  requirements: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNAVAILABLE']).default('ACTIVE'),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const navigationFormSchema = z.object({
  name: z.string().optional(),
  building: z.string().min(2, 'Building name is required'),
  block: z.string().min(1, 'Block is required (e.g. Block A)'),
  floor: z.string().min(1, 'Floor is required (e.g. Floor 1)'),
  room: z.string().min(2, 'Room number/name is required (e.g. Room 204)'),
  counter: z.string().optional(),
  department_id: z.string().optional(),
  category: z.enum([
    'CONSULTATION',
    'RADIOLOGY',
    'LABORATORY',
    'PHARMACY',
    'REGISTRATION',
    'COUNTER',
    'ROOM',
    'DEPARTMENT',
    'OTHER',
  ]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  coord_x: z.coerce.number().min(0).max(500).default(100),
  coord_y: z.coerce.number().min(0).max(500).default(100),
});

export type NavigationFormValues = z.infer<typeof navigationFormSchema>;

export const journeyTemplateFormSchema = z.object({
  name: z.string().min(3, 'Template name is required'),
  department_id: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type JourneyTemplateFormValues = z.infer<typeof journeyTemplateFormSchema>;

export const hospitalSettingsFormSchema = z.object({
  name: z.string().min(3, 'Hospital facility name is required'),
  address: z.string().min(5, 'Physical address is required'),
  contact: z.string().min(5, 'Contact phone and email required'),
  open_time: z.string().min(4, 'Opening time required (e.g. 08:00)').default('08:00'),
  close_time: z.string().min(4, 'Closing time required (e.g. 20:00)').default('20:00'),
  is_emergency_24_7: z.boolean().default(true),
  warning_threshold: z.coerce.number().min(5, 'Min 5 minutes').max(120, 'Max 120 minutes').default(25),
  critical_threshold: z.coerce.number().min(10, 'Min 10 minutes').max(240, 'Max 240 minutes').default(45),
  realtime_frequency: z.enum(['REALTIME_LIVE', 'POLL_3S', 'POLL_5S', 'POLL_10S']).default('REALTIME_LIVE'),
});

export type HospitalSettingsFormValues = z.infer<typeof hospitalSettingsFormSchema>;

export const appointmentActionSchema = z.object({
  action_type: z.enum(['RESCHEDULE', 'REASSIGN_DOCTOR', 'CHANGE_DEPARTMENT', 'CANCEL', 'ADD_NOTES']),
  new_date: z.string().optional(),
  new_start_time: z.string().optional(),
  new_end_time: z.string().optional(),
  doctor_id: z.string().optional(),
  department_id: z.string().optional(),
  cancellation_reason: z.string().optional(),
  notes: z.string().optional(),
});

export type AppointmentActionValues = z.infer<typeof appointmentActionSchema>;

