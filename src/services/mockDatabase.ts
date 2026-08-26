import {
  Hospital,
  Department,
  Doctor,
  Appointment,
  QueueEntry,
  PatientJourney,
  NavigationLocation,
  NotificationItem,
  OperationalAlert,
  AuditLogItem,
  Service,
  OperationsSummary,
  DepartmentWorkload,
} from "../types";
import { socketClient } from "../websocket/socket";

// Initial Hospital Data
export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: "hosp-001",
    name: "Metropolitan Central Hospital",
    code: "MCH",
    address: "742 Evergreen Healthcare Blvd, Metro City",
    city: "Metro City",
    contactNumber: "+1 (555) 010-0000",
    emergencyNumber: "+1 (555) 010-9999",
    operatingHours: "07:00 AM - 10:00 PM (Emergency 24/7)",
    status: "ACTIVE",
    timezone: "America/New_York",
    totalBeds: 650,
    availableBeds: 114,
  },
  {
    id: "hosp-002",
    name: "St. Jude Teaching & Research Hospital",
    code: "SJH",
    address: "100 Academic Way, University District",
    city: "University District",
    contactNumber: "+1 (555) 020-0000",
    emergencyNumber: "+1 (555) 020-9999",
    operatingHours: "08:00 AM - 08:00 PM",
    status: "ACTIVE",
    timezone: "America/New_York",
    totalBeds: 420,
    availableBeds: 82,
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "dept-cardiology",
    hospitalId: "hosp-001",
    name: "Cardiology & Vascular",
    code: "CARD",
    description: "Comprehensive cardiac care, ECG, echocardiograms, and specialist consultations.",
    building: "Main Pavilion",
    block: "Block A",
    floor: "Floor 2",
    roomNumber: "Wing 200-210",
    status: "ACTIVE",
    averageWaitTimeMinutes: 14,
    activeCounters: 3,
    activeDoctorsCount: 3,
    totalWaitingCount: 8,
  },
  {
    id: "dept-neurology",
    hospitalId: "hosp-001",
    name: "Neurology & Neurosciences",
    code: "NEUR",
    description: "Neurological evaluations, EEG, stroke prevention, and specialist clinical clinics.",
    building: "Main Pavilion",
    block: "Block B",
    floor: "Floor 3",
    roomNumber: "Wing 310-320",
    status: "DELAYED",
    averageWaitTimeMinutes: 38,
    activeCounters: 2,
    activeDoctorsCount: 2,
    totalWaitingCount: 16,
  },
  {
    id: "dept-pediatrics",
    hospitalId: "hosp-001",
    name: "Pediatrics & Child Health",
    code: "PEDI",
    description: "General pediatric care, immunization, developmental checks, and adolescent health.",
    building: "West Wing",
    block: "Block C",
    floor: "Floor 1",
    roomNumber: "Wing 100-110",
    status: "ACTIVE",
    averageWaitTimeMinutes: 11,
    activeCounters: 2,
    activeDoctorsCount: 2,
    totalWaitingCount: 5,
  },
  {
    id: "dept-orthopedics",
    hospitalId: "hosp-001",
    name: "Orthopedics & Joint Care",
    code: "ORTH",
    description: "Musculoskeletal health, fracture clinics, sports injuries, and joint replacements.",
    building: "East Wing",
    block: "Block D",
    floor: "Floor 2",
    roomNumber: "Wing 215-225",
    status: "ACTIVE",
    averageWaitTimeMinutes: 19,
    activeCounters: 2,
    activeDoctorsCount: 2,
    totalWaitingCount: 7,
  },
  {
    id: "dept-radiology",
    hospitalId: "hosp-001",
    name: "Radiology & Diagnostic Imaging",
    code: "RADS",
    description: "MRI, CT scans, digital X-rays, ultrasound, and interventional radiology.",
    building: "Diagnostic Center",
    block: "Block A",
    floor: "Floor 1",
    roomNumber: "Suite 108",
    status: "ACTIVE",
    averageWaitTimeMinutes: 22,
    activeCounters: 4,
    activeDoctorsCount: 3,
    totalWaitingCount: 12,
  },
  {
    id: "dept-genmed",
    hospitalId: "hosp-001",
    name: "General Internal Medicine",
    code: "GMED",
    description: "Primary outpatient triage, chronic disease management, and preventive health screenings.",
    building: "Main Pavilion",
    block: "Block A",
    floor: "Floor 1",
    roomNumber: "Suite 101-105",
    status: "ACTIVE",
    averageWaitTimeMinutes: 16,
    activeCounters: 3,
    activeDoctorsCount: 4,
    totalWaitingCount: 9,
  },
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: "serv-card-consult",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    name: "Cardiology Specialist Consultation",
    code: "CARD-CON",
    description: "Comprehensive cardiovascular evaluation and review.",
    expectedDurationMinutes: 15,
    requiresScan: false,
    requiresLab: false,
    status: "ACTIVE",
  },
  {
    id: "serv-card-echo",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    name: "Cardiology Consult + Echocardiogram",
    code: "CARD-ECHO",
    description: "Doctor consultation followed by transthoracic echo imaging in diagnostic room.",
    expectedDurationMinutes: 35,
    requiresScan: true,
    requiresLab: false,
    status: "ACTIVE",
  },
  {
    id: "serv-neuro-consult",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    name: "Neurology Clinical Review",
    code: "NEUR-CON",
    description: "Full neurological examination and treatment planning.",
    expectedDurationMinutes: 20,
    requiresScan: false,
    requiresLab: false,
    status: "ACTIVE",
  },
  {
    id: "serv-pedi-check",
    departmentId: "dept-pediatrics",
    departmentName: "Pediatrics & Child Health",
    name: "General Pediatric Consultation",
    code: "PEDI-GEN",
    description: "Child health assessment, vitals check, and prescription.",
    expectedDurationMinutes: 15,
    requiresScan: false,
    requiresLab: false,
    status: "ACTIVE",
  },
  {
    id: "serv-ortho-joint",
    departmentId: "dept-orthopedics",
    departmentName: "Orthopedics & Joint Care",
    name: "Orthopedic Consult + X-Ray Review",
    code: "ORTH-XRAY",
    description: "Joint assessment with integrated radiology imaging review.",
    expectedDurationMinutes: 25,
    requiresScan: true,
    requiresLab: false,
    status: "ACTIVE",
  },
  {
    id: "serv-rad-mri",
    departmentId: "dept-radiology",
    departmentName: "Radiology & Diagnostic Imaging",
    name: "High-Resolution Diagnostic MRI Scan",
    code: "RAD-MRI",
    description: "3T MRI scan with pre-scan safety clearance.",
    expectedDurationMinutes: 45,
    requiresScan: true,
    requiresLab: false,
    status: "ACTIVE",
  },
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "doc-cardio-1",
    staffId: "DOC-4102",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    name: "Dr. Sarah Mitchell, MD",
    qualification: "MD, FACC, Harvard Medical School",
    specialization: "Interventional Cardiology & Arrhythmia",
    roomNumber: "Room 204",
    availability: "IN_CONSULTATION",
    statusMessage: "Consulting token C-21",
    currentPatientToken: "C-21",
    currentPatientName: "Robert Thorne",
    patientsServedToday: 14,
    patientsWaitingCount: 5,
    avgConsultationMinutes: 14,
    workingHours: "08:00 AM - 04:00 PM",
  },
  {
    id: "doc-cardio-2",
    staffId: "DOC-4109",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    name: "Dr. Alan Mercer, MD",
    qualification: "MD, FRCP, Johns Hopkins",
    specialization: "Heart Failure & Echocardiography",
    roomNumber: "Room 206",
    availability: "AVAILABLE",
    statusMessage: "Ready for next patient",
    patientsServedToday: 12,
    patientsWaitingCount: 3,
    avgConsultationMinutes: 16,
    workingHours: "09:00 AM - 05:00 PM",
  },
  {
    id: "doc-neuro-1",
    staffId: "DOC-5829",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    name: "Dr. Elena Rostova, MD",
    qualification: "MD, PhD, Stanford University",
    specialization: "Epilepsy & Neuro-vascular Disorders",
    roomNumber: "Room 312",
    availability: "IN_CONSULTATION",
    statusMessage: "Consulting token N-14",
    currentPatientToken: "N-14",
    currentPatientName: "Eleanor Vance",
    patientsServedToday: 9,
    patientsWaitingCount: 9,
    avgConsultationMinutes: 22,
    workingHours: "08:30 AM - 04:30 PM",
  },
  {
    id: "doc-neuro-2",
    staffId: "DOC-5834",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    name: "Dr. Jonathan Hayes, MD",
    qualification: "MD, FAAN, Mayo Clinic",
    specialization: "Cognitive Disorders & Movement",
    roomNumber: "Room 314",
    availability: "UNAVAILABLE",
    statusMessage: "Emergency Surgical Rotation / Hospital Leave",
    unavailableReason: "Emergency Surgical Rotation",
    patientsServedToday: 4,
    patientsWaitingCount: 7,
    avgConsultationMinutes: 19,
    workingHours: "08:00 AM - 04:00 PM",
  },
  {
    id: "doc-pedi-1",
    staffId: "DOC-6101",
    hospitalId: "hosp-001",
    departmentId: "dept-pediatrics",
    departmentName: "Pediatrics & Child Health",
    name: "Dr. Kevin Patel, MD",
    qualification: "MD, FAAP, Columbia University",
    specialization: "General Pediatrics & Neonatal Care",
    roomNumber: "Room 105",
    availability: "AVAILABLE",
    statusMessage: "Available in Consultation Room",
    patientsServedToday: 18,
    patientsWaitingCount: 3,
    avgConsultationMinutes: 12,
    workingHours: "08:00 AM - 03:30 PM",
  },
  {
    id: "doc-ortho-1",
    staffId: "DOC-7201",
    hospitalId: "hosp-001",
    departmentId: "dept-orthopedics",
    departmentName: "Orthopedics & Joint Care",
    name: "Dr. Samantha Reed, MD",
    qualification: "MD, FAAOS, Duke University",
    specialization: "Joint Reconstruction & Sports Medicine",
    roomNumber: "Room 218",
    availability: "ON_BREAK",
    statusMessage: "Clinical break until 11:15 AM",
    patientsServedToday: 11,
    patientsWaitingCount: 4,
    avgConsultationMinutes: 18,
    workingHours: "09:00 AM - 05:00 PM",
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-001",
    referenceNumber: "APT-2026-0826-01",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceId: "serv-card-consult",
    serviceName: "Cardiology Specialist Consultation",
    patientId: "pat-101",
    patientName: "Robert Thorne",
    patientPhone: "+1 (555) 234-5678",
    patientMrn: "MRN-88492",
    appointmentDate: "2026-08-26",
    expectedStartTime: "10:00 AM",
    expectedEndTime: "10:15 AM",
    recommendedArrivalTime: "09:40 AM",
    checkedInAt: "09:38 AM",
    status: "IN_CONSULTATION",
    queueToken: "C-21",
    queuePosition: 0,
    priorityLevel: "NORMAL",
    notes: "Follow-up for hypertensive medication review.",
  },
  {
    id: "apt-002",
    referenceNumber: "APT-2026-0826-02",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceId: "serv-card-echo",
    serviceName: "Cardiology Consult + Echocardiogram",
    patientId: "pat-102",
    patientName: "Beatrice Montgomery",
    patientPhone: "+1 (555) 345-6789",
    patientMrn: "MRN-91024",
    appointmentDate: "2026-08-26",
    expectedStartTime: "10:20 AM",
    expectedEndTime: "10:55 AM",
    recommendedArrivalTime: "10:00 AM",
    checkedInAt: "09:55 AM",
    status: "CALLED",
    queueToken: "C-22",
    queuePosition: 1,
    priorityLevel: "ELDERLY",
    notes: "Requires wheelchair assistance.",
  },
  {
    id: "apt-003",
    referenceNumber: "APT-2026-0826-03",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceId: "serv-card-consult",
    serviceName: "Cardiology Specialist Consultation",
    patientId: "pat-103",
    patientName: "Michael Chang",
    patientPhone: "+1 (555) 456-7890",
    patientMrn: "MRN-72301",
    appointmentDate: "2026-08-26",
    expectedStartTime: "10:40 AM",
    expectedEndTime: "10:55 AM",
    recommendedArrivalTime: "10:20 AM",
    checkedInAt: "10:15 AM",
    status: "CHECKED_IN",
    queueToken: "C-23",
    queuePosition: 2,
    priorityLevel: "NORMAL",
  },
  {
    id: "apt-004",
    referenceNumber: "APT-2026-0826-04",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-2",
    doctorName: "Dr. Alan Mercer, MD",
    serviceId: "serv-card-consult",
    serviceName: "Cardiology Specialist Consultation",
    patientId: "pat-104",
    patientName: "Emily Watson",
    patientPhone: "+1 (555) 567-8901",
    patientMrn: "MRN-66120",
    appointmentDate: "2026-08-26",
    expectedStartTime: "11:00 AM",
    expectedEndTime: "11:15 AM",
    recommendedArrivalTime: "10:35 AM",
    status: "CONFIRMED",
    priorityLevel: "NORMAL",
  },
  {
    id: "apt-005",
    referenceNumber: "APT-2026-0826-05",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    doctorId: "doc-neuro-1",
    doctorName: "Dr. Elena Rostova, MD",
    serviceId: "serv-neuro-consult",
    serviceName: "Neurology Clinical Review",
    patientId: "pat-105",
    patientName: "Eleanor Vance",
    patientPhone: "+1 (555) 678-9012",
    patientMrn: "MRN-33419",
    appointmentDate: "2026-08-26",
    expectedStartTime: "09:45 AM",
    expectedEndTime: "10:15 AM",
    recommendedArrivalTime: "09:25 AM",
    checkedInAt: "09:20 AM",
    status: "IN_CONSULTATION",
    queueToken: "N-14",
    queuePosition: 0,
    priorityLevel: "PRIORITY",
    notes: "Post-seizure follow-up evaluation.",
  },
  {
    id: "apt-006",
    referenceNumber: "APT-2026-0826-06",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    doctorId: "doc-neuro-2",
    doctorName: "Dr. Jonathan Hayes, MD",
    serviceId: "serv-neuro-consult",
    serviceName: "Neurology Clinical Review",
    patientId: "pat-106",
    patientName: "Samuel Brooks",
    patientPhone: "+1 (555) 789-0123",
    patientMrn: "MRN-55902",
    appointmentDate: "2026-08-26",
    expectedStartTime: "10:30 AM",
    expectedEndTime: "10:50 AM",
    recommendedArrivalTime: "10:10 AM",
    status: "DELAYED",
    affectedByDoctorAbsence: true,
    priorityLevel: "NORMAL",
    notes: "Affected by Dr. Hayes emergency leave. Alternative reassignment pending.",
  },
  {
    id: "apt-007",
    referenceNumber: "APT-2026-0826-07",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    doctorId: "doc-neuro-2",
    doctorName: "Dr. Jonathan Hayes, MD",
    serviceId: "serv-neuro-consult",
    serviceName: "Neurology Clinical Review",
    patientId: "pat-107",
    patientName: "Clara Delgado",
    patientPhone: "+1 (555) 890-1234",
    patientMrn: "MRN-44109",
    appointmentDate: "2026-08-26",
    expectedStartTime: "11:00 AM",
    expectedEndTime: "11:20 AM",
    recommendedArrivalTime: "10:40 AM",
    status: "DELAYED",
    affectedByDoctorAbsence: true,
    priorityLevel: "NORMAL",
    notes: "Affected by Dr. Hayes emergency leave.",
  },
  {
    id: "apt-008",
    referenceNumber: "APT-2026-0826-08",
    hospitalId: "hosp-001",
    departmentId: "dept-pediatrics",
    departmentName: "Pediatrics & Child Health",
    doctorId: "doc-pedi-1",
    doctorName: "Dr. Kevin Patel, MD",
    serviceId: "serv-pedi-check",
    serviceName: "General Pediatric Consultation",
    patientId: "pat-108",
    patientName: "Lucas Rivera (Parent: Maria)",
    patientPhone: "+1 (555) 901-2345",
    patientMrn: "MRN-12883",
    appointmentDate: "2026-08-26",
    expectedStartTime: "10:15 AM",
    expectedEndTime: "10:30 AM",
    recommendedArrivalTime: "09:55 AM",
    checkedInAt: "09:50 AM",
    status: "CHECKED_IN",
    queueToken: "P-31",
    queuePosition: 1,
    priorityLevel: "NORMAL",
    notes: "3-year developmental assessment and immunization review.",
  },
  {
    id: "apt-009",
    referenceNumber: "APT-2026-0826-09",
    hospitalId: "hosp-001",
    departmentId: "dept-orthopedics",
    departmentName: "Orthopedics & Joint Care",
    doctorId: "doc-ortho-1",
    doctorName: "Dr. Samantha Reed, MD",
    serviceId: "serv-ortho-joint",
    serviceName: "Orthopedic Consult + X-Ray Review",
    patientId: "pat-109",
    patientName: "George Washington",
    patientPhone: "+1 (555) 012-3456",
    patientMrn: "MRN-77412",
    appointmentDate: "2026-08-26",
    expectedStartTime: "11:15 AM",
    expectedEndTime: "11:40 AM",
    recommendedArrivalTime: "10:50 AM",
    checkedInAt: "10:48 AM",
    status: "CHECKED_IN",
    queueToken: "O-12",
    queuePosition: 1,
    priorityLevel: "NORMAL",
    notes: "Right knee arthroscopy follow-up.",
  },
  {
    id: "apt-010",
    referenceNumber: "APT-2026-0826-10",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceId: "serv-card-consult",
    serviceName: "Cardiology Specialist Consultation",
    patientId: "pat-110",
    patientName: "Alice Greenfield",
    patientPhone: "+1 (555) 123-4567",
    patientMrn: "MRN-33019",
    appointmentDate: "2026-08-26",
    expectedStartTime: "09:15 AM",
    expectedEndTime: "09:30 AM",
    recommendedArrivalTime: "08:50 AM",
    checkedInAt: "08:45 AM",
    status: "COMPLETED",
    queueToken: "C-20",
    queuePosition: 0,
    priorityLevel: "NORMAL",
  },
];

export const INITIAL_QUEUES: QueueEntry[] = [
  {
    id: "q-001",
    appointmentId: "apt-001",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceName: "Cardiology Specialist Consultation",
    tokenNumber: "C-21",
    position: 0,
    patientId: "pat-101",
    patientName: "Robert Thorne",
    patientMrn: "MRN-88492",
    status: "IN_PROGRESS",
    checkedInAt: "09:38 AM",
    calledAt: "09:58 AM",
    startedAt: "10:02 AM",
    estimatedWaitMinutes: 0,
    roomNumber: "Room 204",
    priority: "NORMAL",
  },
  {
    id: "q-002",
    appointmentId: "apt-002",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceName: "Cardiology Consult + Echocardiogram",
    tokenNumber: "C-22",
    position: 1,
    patientId: "pat-102",
    patientName: "Beatrice Montgomery",
    patientMrn: "MRN-91024",
    status: "CALLED",
    checkedInAt: "09:55 AM",
    calledAt: "10:14 AM",
    estimatedWaitMinutes: 3,
    roomNumber: "Room 204",
    priority: "ELDERLY",
  },
  {
    id: "q-003",
    appointmentId: "apt-003",
    hospitalId: "hosp-001",
    departmentId: "dept-cardiology",
    departmentName: "Cardiology & Vascular",
    doctorId: "doc-cardio-1",
    doctorName: "Dr. Sarah Mitchell, MD",
    serviceName: "Cardiology Specialist Consultation",
    tokenNumber: "C-23",
    position: 2,
    patientId: "pat-103",
    patientName: "Michael Chang",
    patientMrn: "MRN-72301",
    status: "WAITING",
    checkedInAt: "10:15 AM",
    estimatedWaitMinutes: 16,
    roomNumber: "Room 204",
    priority: "NORMAL",
  },
  {
    id: "q-004",
    appointmentId: "apt-005",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    doctorId: "doc-neuro-1",
    doctorName: "Dr. Elena Rostova, MD",
    serviceName: "Neurology Clinical Review",
    tokenNumber: "N-14",
    position: 0,
    patientId: "pat-105",
    patientName: "Eleanor Vance",
    patientMrn: "MRN-33419",
    status: "IN_PROGRESS",
    checkedInAt: "09:20 AM",
    calledAt: "09:42 AM",
    startedAt: "09:46 AM",
    estimatedWaitMinutes: 0,
    roomNumber: "Room 312",
    priority: "PRIORITY",
  },
  {
    id: "q-005",
    appointmentId: "apt-008",
    hospitalId: "hosp-001",
    departmentId: "dept-pediatrics",
    departmentName: "Pediatrics & Child Health",
    doctorId: "doc-pedi-1",
    doctorName: "Dr. Kevin Patel, MD",
    serviceName: "General Pediatric Consultation",
    tokenNumber: "P-31",
    position: 1,
    patientId: "pat-108",
    patientName: "Lucas Rivera",
    patientMrn: "MRN-12883",
    status: "WAITING",
    checkedInAt: "09:50 AM",
    estimatedWaitMinutes: 8,
    roomNumber: "Room 105",
    priority: "NORMAL",
  },
  {
    id: "q-006",
    appointmentId: "apt-009",
    hospitalId: "hosp-001",
    departmentId: "dept-orthopedics",
    departmentName: "Orthopedics & Joint Care",
    doctorId: "doc-ortho-1",
    doctorName: "Dr. Samantha Reed, MD",
    serviceName: "Orthopedic Consult + X-Ray Review",
    tokenNumber: "O-12",
    position: 1,
    patientId: "pat-109",
    patientName: "George Washington",
    patientMrn: "MRN-77412",
    status: "WAITING",
    checkedInAt: "10:48 AM",
    estimatedWaitMinutes: 19,
    roomNumber: "Room 218",
    priority: "NORMAL",
  },
];

export const INITIAL_JOURNEYS: Record<string, PatientJourney> = {
  "apt-002": {
    id: "jrn-002",
    appointmentId: "apt-002",
    patientName: "Beatrice Montgomery",
    patientMrn: "MRN-91024",
    serviceName: "Cardiology Consult + Echocardiogram",
    currentStepIndex: 2,
    status: "ACTIVE",
    currentLocation: "Cardiology Waiting Lounge (Floor 2, Block A)",
    nextDestination: "Cardiology Consultation Room 204",
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        name: "Central Arrival & Check-In",
        location: "Reception Counter #4 (Ground Floor)",
        departmentName: "Central Reception",
        roomNumber: "Counter 4",
        order: 1,
        status: "COMPLETED",
        completedAt: "09:55 AM",
      },
      {
        id: "step-2",
        name: "Vitals & Nursing Triage",
        location: "Cardiology Nursing Station (Floor 2)",
        departmentName: "Cardiology & Vascular",
        roomNumber: "Station 2B",
        order: 2,
        status: "COMPLETED",
        completedAt: "10:08 AM",
      },
      {
        id: "step-3",
        name: "Doctor Consultation (Dr. Mitchell)",
        location: "Cardiology Consultation Wing (Floor 2)",
        departmentName: "Cardiology & Vascular",
        roomNumber: "Room 204",
        order: 3,
        status: "IN_PROGRESS",
      },
      {
        id: "step-4",
        name: "Transthoracic Echocardiogram Scan",
        location: "Diagnostic Imaging Center (Floor 1)",
        departmentName: "Radiology & Diagnostic Imaging",
        roomNumber: "Echo Suite 106",
        order: 4,
        status: "PENDING",
      },
      {
        id: "step-5",
        name: "Post-Scan Doctor Review & Prescription",
        location: "Cardiology Consultation Wing (Floor 2)",
        departmentName: "Cardiology & Vascular",
        roomNumber: "Room 204",
        order: 5,
        status: "PENDING",
      },
      {
        id: "step-6",
        name: "Pharmacy & Discharge",
        location: "Central Outpatient Pharmacy (Ground Floor)",
        departmentName: "Hospital Pharmacy",
        roomNumber: "Counters 1-3",
        order: 6,
        status: "PENDING",
      },
    ],
  },
};

export const INITIAL_NAVIGATIONS: NavigationLocation[] = [
  {
    id: "nav-001",
    hospitalId: "hosp-001",
    name: "Central Reception & Check-In Counter",
    type: "COUNTER",
    building: "Main Pavilion",
    block: "Block A",
    floor: "Ground Floor",
    room: "Lobby",
    counter: "Counters 1 - 8",
    directions: "Enter via Main Entrance. Turn immediately right past the security checkpoint.",
    coordinates: { x: 120, y: 350 },
  },
  {
    id: "nav-002",
    hospitalId: "hosp-001",
    name: "Cardiology Consultation Room 204 (Dr. Mitchell)",
    type: "CONSULTATION_ROOM",
    building: "Main Pavilion",
    block: "Block A",
    floor: "Floor 2",
    room: "Room 204",
    directions: "Take Elevator A to Floor 2. Follow Blue floor striping to Cardiac Wing, second door on the left.",
    coordinates: { x: 280, y: 190 },
  },
  {
    id: "nav-003",
    hospitalId: "hosp-001",
    name: "Neurology Specialist Suite 312 (Dr. Rostova)",
    type: "CONSULTATION_ROOM",
    building: "Main Pavilion",
    block: "Block B",
    floor: "Floor 3",
    room: "Room 312",
    directions: "Take Elevator B to Floor 3. Turn right into Neurosciences Tower corridor.",
    coordinates: { x: 420, y: 150 },
  },
  {
    id: "nav-004",
    hospitalId: "hosp-001",
    name: "Diagnostic Radiology & MRI Suite 108",
    type: "RADIOLOGY",
    building: "Diagnostic Center",
    block: "Block A",
    floor: "Floor 1",
    room: "Suite 108",
    directions: "Take Corridor A to Diagnostic Center. Check in at Radiology Sub-Desk.",
    coordinates: { x: 220, y: 280 },
  },
  {
    id: "nav-005",
    hospitalId: "hosp-001",
    name: "Central Outpatient Pharmacy",
    type: "PHARMACY",
    building: "Main Pavilion",
    block: "Block A",
    floor: "Ground Floor",
    room: "Pharmacy Concourse",
    counter: "Dispensing 1 - 6",
    directions: "Adjacent to Main Exit lobby and payment cashiers.",
    coordinates: { x: 180, y: 380 },
  },
  {
    id: "nav-006",
    hospitalId: "hosp-001",
    name: "Pediatric Care Room 105 (Dr. Patel)",
    type: "CONSULTATION_ROOM",
    building: "West Wing",
    block: "Block C",
    floor: "Floor 1",
    room: "Room 105",
    directions: "Follow Yellow animal footprints through West Wing entrance.",
    coordinates: { x: 140, y: 220 },
  },
];

export const INITIAL_ALERTS: OperationalAlert[] = [
  {
    id: "alt-001",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    severity: "WARNING",
    title: "Doctor Absence: Dr. Jonathan Hayes Unavailable",
    description: "Dr. Hayes is on Emergency Surgical Rotation. 2 scheduled outpatient appointments require staff reassignment or rescheduling.",
    timestamp: "10:00 AM Today",
    resolved: false,
    actionRequired: "Review Affected Appointments",
    actionRoute: "/doctors",
    affectedCount: 2,
  },
  {
    id: "alt-002",
    hospitalId: "hosp-001",
    departmentId: "dept-neurology",
    departmentName: "Neurology & Neurosciences",
    severity: "WARNING",
    title: "Queue Delay Detected in Neurology",
    description: "Neurology average waiting time has reached 38 minutes (threshold: 25 min) due to complex clinical evaluations.",
    timestamp: "10:15 AM Today",
    resolved: false,
    actionRequired: "Monitor Station Queue",
    actionRoute: "/queue",
    affectedCount: 16,
  },
  {
    id: "alt-003",
    hospitalId: "hosp-001",
    severity: "INFO",
    title: "Emergency Bed Capacity Normal",
    description: "Hospital-wide acute bed occupancy is currently at 82%. Routine clinic admissions operating normally.",
    timestamp: "09:00 AM Today",
    resolved: true,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-001",
    hospitalId: "hosp-001",
    type: "DOCTOR_UNAVAILABLE",
    title: "Doctor Unavailability Notice",
    message: "Dr. Jonathan Hayes (Neurology) was marked UNAVAILABLE for today. Action required.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    link: "/doctors",
  },
  {
    id: "notif-002",
    hospitalId: "hosp-001",
    type: "PATIENT_CHECKED_IN",
    title: "Patient Check-In (Cardiology)",
    message: "Patient Michael Chang (Token C-23) has completed kiosk check-in.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    link: "/queue",
  },
  {
    id: "notif-003",
    hospitalId: "hosp-001",
    type: "QUEUE_DELAY",
    title: "Department Queue Alert",
    message: "Neurology average wait time exceeded standard operational SLA.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    link: "/operations",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-001",
    timestamp: "10:14 AM Today",
    actorId: "staff-005",
    actorName: "David Wong",
    role: "QUEUE_OPERATOR",
    hospitalId: "hosp-001",
    action: "CALL_NEXT_PATIENT",
    resource: "QueueEntry: q-002 (C-22)",
    details: "Called Token C-22 (Beatrice Montgomery) to Room 204.",
  },
  {
    id: "aud-002",
    timestamp: "10:02 AM Today",
    actorId: "staff-002",
    actorName: "Dr. Sarah Mitchell",
    role: "DOCTOR",
    hospitalId: "hosp-001",
    action: "START_CONSULTATION",
    resource: "Appointment: apt-001",
    details: "Initiated clinical consultation for Token C-21 (Robert Thorne).",
  },
  {
    id: "aud-003",
    timestamp: "10:00 AM Today",
    actorId: "staff-001",
    actorName: "Dr. Marcus Vance",
    role: "HOSPITAL_ADMIN",
    hospitalId: "hosp-001",
    action: "UPDATE_DOCTOR_AVAILABILITY",
    resource: "Doctor: doc-neuro-2 (Dr. Hayes)",
    details: "Marked status UNAVAILABLE (Reason: Emergency Surgical Rotation). Triggered reassignment workflow.",
  },
  {
    id: "aud-004",
    timestamp: "09:55 AM Today",
    actorId: "staff-004",
    actorName: "James Miller",
    role: "RECEPTION_STAFF",
    hospitalId: "hosp-001",
    action: "PATIENT_CHECK_IN",
    resource: "Appointment: apt-002",
    details: "Verified patient Beatrice Montgomery (MRN-91024), assigned Queue Token C-22.",
  },
];

// Reactive In-Memory Store
class MockHospitalDatabase {
  public hospitals: Hospital[] = [...INITIAL_HOSPITALS];
  public departments: Department[] = [...INITIAL_DEPARTMENTS];
  public services: Service[] = [...INITIAL_SERVICES];
  public doctors: Doctor[] = [...INITIAL_DOCTORS];
  public appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
  public queues: QueueEntry[] = [...INITIAL_QUEUES];
  public journeys: Record<string, PatientJourney> = { ...INITIAL_JOURNEYS };
  public navigations: NavigationLocation[] = [...INITIAL_NAVIGATIONS];
  public alerts: OperationalAlert[] = [...INITIAL_ALERTS];
  public notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  public auditLogs: AuditLogItem[] = [...INITIAL_AUDIT_LOGS];

  // Helper to record audit log
  public logAudit(actorName: string, role: any, action: string, resource: string, details: string) {
    const entry: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Today",
      actorId: "staff-active",
      actorName,
      role,
      hospitalId: "hosp-001",
      action,
      resource,
      details,
    };
    this.auditLogs.unshift(entry);
  }

  // Queue Operations
  public callNextPatient(departmentId: string, doctorId?: string, actorName = "Staff"): QueueEntry | null {
    // Find next waiting patient in department (or specific doctor)
    const nextWaiting = this.queues.find(
      (q) =>
        q.departmentId === departmentId &&
        q.status === "WAITING" &&
        (!doctorId || q.doctorId === doctorId)
    );

    if (!nextWaiting) return null;

    nextWaiting.status = "CALLED";
    nextWaiting.calledAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Update appointment
    const apt = this.appointments.find((a) => a.id === nextWaiting.appointmentId);
    if (apt) {
      apt.status = "CALLED";
    }

    // Update doctor current patient if assigned
    const doc = this.doctors.find((d) => d.id === nextWaiting.doctorId);
    if (doc) {
      doc.currentPatientToken = nextWaiting.tokenNumber;
      doc.currentPatientName = nextWaiting.patientName;
      doc.statusMessage = `Called token ${nextWaiting.tokenNumber}`;
    }

    this.logAudit(
      actorName,
      "QUEUE_OPERATOR",
      "CALL_NEXT_PATIENT",
      `QueueToken: ${nextWaiting.tokenNumber}`,
      `Called ${nextWaiting.patientName} (${nextWaiting.tokenNumber}) to ${nextWaiting.roomNumber}.`
    );

    // Broadcast Realtime Event
    socketClient.emitLocalEvent("PATIENT_CALLED", {
      departmentId,
      queueEntry: nextWaiting,
      action: "CALL",
    });
    socketClient.emitLocalEvent("QUEUE_UPDATED", {
      departmentId,
      queueEntry: nextWaiting,
      action: "CALL",
    });

    return nextWaiting;
  }

  public updateQueueStatus(
    queueId: string,
    newStatus: "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "NO_SHOW" | "CANCELLED" | "TRANSFERRED",
    actorName = "Staff",
    transferDeptId?: string
  ): QueueEntry | null {
    const entry = this.queues.find((q) => q.id === queueId);
    if (!entry) return null;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    entry.status = newStatus;

    const apt = this.appointments.find((a) => a.id === entry.appointmentId);
    const doc = this.doctors.find((d) => d.id === entry.doctorId);

    if (newStatus === "IN_PROGRESS") {
      entry.startedAt = timeNow;
      if (apt) apt.status = "IN_CONSULTATION";
      if (doc) {
        doc.availability = "IN_CONSULTATION";
        doc.statusMessage = `Consulting token ${entry.tokenNumber}`;
      }
      socketClient.emitLocalEvent("CONSULTATION_STARTED", { queueEntry: entry });
    } else if (newStatus === "COMPLETED") {
      entry.completedAt = timeNow;
      if (apt) apt.status = "COMPLETED";
      if (doc) {
        doc.patientsServedToday += 1;
        doc.currentPatientToken = undefined;
        doc.currentPatientName = undefined;
        doc.availability = "AVAILABLE";
        doc.statusMessage = "Ready for next patient";
      }

      // If patient journey exists, advance it
      if (this.journeys[entry.appointmentId]) {
        const jrn = this.journeys[entry.appointmentId];
        if (jrn.steps[jrn.currentStepIndex]) {
          jrn.steps[jrn.currentStepIndex].status = "COMPLETED";
          jrn.steps[jrn.currentStepIndex].completedAt = timeNow;
          jrn.currentStepIndex = Math.min(jrn.currentStepIndex + 1, jrn.steps.length - 1);
          if (jrn.currentStepIndex < jrn.steps.length) {
            jrn.steps[jrn.currentStepIndex].status = "IN_PROGRESS";
            jrn.currentLocation = jrn.steps[jrn.currentStepIndex].location;
            jrn.nextDestination = jrn.steps[Math.min(jrn.currentStepIndex + 1, jrn.steps.length - 1)].name;
          } else {
            jrn.status = "COMPLETED";
          }
        }
        socketClient.emitLocalEvent("JOURNEY_UPDATED", { journey: jrn });
      }

      socketClient.emitLocalEvent("CONSULTATION_COMPLETED", { queueEntry: entry });
    } else if (newStatus === "SKIPPED") {
      if (apt) apt.status = "DELAYED";
      socketClient.emitLocalEvent("PATIENT_SKIPPED", { queueEntry: entry });
    } else if (newStatus === "NO_SHOW") {
      if (apt) apt.status = "NO_SHOW";
      if (doc) {
        doc.currentPatientToken = undefined;
        doc.currentPatientName = undefined;
      }
      socketClient.emitLocalEvent("PATIENT_NO_SHOW", { queueEntry: entry });
    } else if (newStatus === "TRANSFERRED" && transferDeptId) {
      const targetDept = this.departments.find((d) => d.id === transferDeptId);
      if (targetDept) {
        entry.departmentId = targetDept.id;
        entry.departmentName = targetDept.name;
        entry.tokenNumber = `${targetDept.code[0]}-${Math.floor(10 + Math.random() * 80)}`;
        entry.status = "WAITING";
      }
    }

    this.logAudit(
      actorName,
      "QUEUE_OPERATOR",
      `UPDATE_QUEUE_${newStatus}`,
      `QueueToken: ${entry.tokenNumber}`,
      `Status changed to ${newStatus} for ${entry.patientName}`
    );

    socketClient.emitLocalEvent("QUEUE_UPDATED", { queueEntry: entry, action: newStatus });
    return entry;
  }

  // Check In Patient
  public checkInAppointment(appointmentId: string, priorityLevel: "NORMAL" | "PRIORITY" | "ELDERLY" = "NORMAL", actorName = "Staff"): { appointment: Appointment; queueEntry: QueueEntry } | null {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return null;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dept = this.departments.find((d) => d.id === apt.departmentId);
    const tokenCode = `${dept?.code[0] || "T"}-${Math.floor(25 + Math.random() * 60)}`;

    apt.status = "CHECKED_IN";
    apt.checkedInAt = timeNow;
    apt.queueToken = tokenCode;
    apt.priorityLevel = priorityLevel;

    // Create queue entry
    const newQueueEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      appointmentId: apt.id,
      hospitalId: apt.hospitalId,
      departmentId: apt.departmentId,
      departmentName: apt.departmentName,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      serviceName: apt.serviceName,
      tokenNumber: tokenCode,
      position: this.queues.filter((q) => q.departmentId === apt.departmentId && q.status === "WAITING").length + 1,
      patientId: apt.patientId,
      patientName: apt.patientName,
      patientMrn: apt.patientMrn,
      status: "WAITING",
      checkedInAt: timeNow,
      estimatedWaitMinutes: (dept?.averageWaitTimeMinutes || 15) * (this.queues.filter((q) => q.departmentId === apt.departmentId && q.status === "WAITING").length + 1),
      roomNumber: dept?.roomNumber || "Main Clinic",
      priority: priorityLevel,
      notes: apt.notes,
    };

    this.queues.push(newQueueEntry);

    // Create journey if none exists
    if (!this.journeys[apt.id]) {
      this.journeys[apt.id] = {
        id: `jrn-${Date.now()}`,
        appointmentId: apt.id,
        patientName: apt.patientName,
        patientMrn: apt.patientMrn,
        serviceName: apt.serviceName,
        currentStepIndex: 1,
        status: "ACTIVE",
        currentLocation: `${dept?.name || "Clinic"} Waiting Area (${dept?.floor || "Floor 1"})`,
        nextDestination: `${dept?.name || "Clinic"} Consultation Room (${apt.doctorName})`,
        updatedAt: new Date().toISOString(),
        steps: [
          {
            id: "step-1",
            name: "Reception & Kiosk Check-In",
            location: "Central Reception (Ground Floor)",
            departmentName: "Central Reception",
            roomNumber: "Counter 1",
            order: 1,
            status: "COMPLETED",
            completedAt: timeNow,
          },
          {
            id: "step-2",
            name: "Waiting in Department Lounge",
            location: `${dept?.building} - ${dept?.floor}`,
            departmentName: dept?.name || "Clinic",
            roomNumber: dept?.roomNumber || "Lounge",
            order: 2,
            status: "IN_PROGRESS",
          },
          {
            id: "step-3",
            name: `Doctor Consultation (${apt.doctorName})`,
            location: `${dept?.building} - ${dept?.floor}`,
            departmentName: dept?.name || "Clinic",
            roomNumber: dept?.roomNumber || "Clinic",
            order: 3,
            status: "PENDING",
          },
          {
            id: "step-4",
            name: "Pharmacy / Discharge Summary",
            location: "Pharmacy Concourse",
            departmentName: "Pharmacy",
            roomNumber: "Counter 2",
            order: 4,
            status: "PENDING",
          },
        ],
      };
    }

    this.logAudit(
      actorName,
      "RECEPTION_STAFF",
      "CHECK_IN_PATIENT",
      `Appointment: ${apt.referenceNumber}`,
      `Checked in ${apt.patientName} (Token ${tokenCode}) with priority ${priorityLevel}.`
    );

    socketClient.emitLocalEvent("PATIENT_CHECKED_IN", {
      departmentId: apt.departmentId,
      queueEntry: newQueueEntry,
      appointment: apt,
    });
    socketClient.emitLocalEvent("QUEUE_UPDATED", {
      departmentId: apt.departmentId,
      queueEntry: newQueueEntry,
      action: "CHECK_IN",
    });

    return { appointment: apt, queueEntry: newQueueEntry };
  }

  // Doctor Availability & Doctor Unavailable Flow
  public setDoctorAvailability(
    doctorId: string,
    status: "AVAILABLE" | "IN_CONSULTATION" | "ON_BREAK" | "UNAVAILABLE" | "ON_LEAVE",
    reason?: string,
    actorName = "Admin"
  ): { doctor: Doctor; affectedAppointments: Appointment[] } | null {
    const doc = this.doctors.find((d) => d.id === doctorId);
    if (!doc) return null;

    doc.availability = status;
    doc.unavailableReason = status === "UNAVAILABLE" || status === "ON_LEAVE" ? reason || "Leave / Emergency" : undefined;
    doc.statusMessage =
      status === "AVAILABLE"
        ? "Available for consultations"
        : status === "UNAVAILABLE"
        ? reason || "Doctor unavailable"
        : status === "ON_BREAK"
        ? reason || "On clinical break"
        : doc.statusMessage;

    let affectedAppointments: Appointment[] = [];

    if (status === "UNAVAILABLE" || status === "ON_LEAVE") {
      // Find today's uncompleted appointments assigned to this doctor
      affectedAppointments = this.appointments.filter(
        (a) => a.doctorId === doctorId && (a.status === "CONFIRMED" || a.status === "CHECKED_IN" || a.status === "DELAYED")
      );

      affectedAppointments.forEach((a) => {
        a.status = "DELAYED";
        a.affectedByDoctorAbsence = true;
        a.notes = `Doctor marked unavailable (${reason || "Emergency"}). Reassignment or reschedule needed.`;
      });

      // Add alert
      const newAlert: OperationalAlert = {
        id: `alt-${Date.now()}`,
        hospitalId: "hosp-001",
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        severity: "WARNING",
        title: `Doctor Unavailable: ${doc.name}`,
        description: `${doc.name} was marked ${status} (${reason || "No reason given"}). ${affectedAppointments.length} appointments affected.`,
        timestamp: "Just now",
        resolved: false,
        actionRequired: "Reassign or Reschedule",
        actionRoute: "/doctors",
        affectedCount: affectedAppointments.length,
      };
      this.alerts.unshift(newAlert);

      // Add notification
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        hospitalId: "hosp-001",
        type: "DOCTOR_UNAVAILABLE",
        title: `Doctor Absence: ${doc.name}`,
        message: `${doc.name} unavailable. ${affectedAppointments.length} patients require reassignment.`,
        read: false,
        createdAt: new Date().toISOString(),
        link: "/doctors",
      });

      socketClient.emitLocalEvent("DOCTOR_UNAVAILABLE", {
        doctor: doc,
        affectedAppointmentsCount: affectedAppointments.length,
      });
      socketClient.emitLocalEvent("SYSTEM_ALERT_CREATED", { alert: newAlert });
    } else {
      socketClient.emitLocalEvent("DOCTOR_AVAILABLE", { doctor: doc });
    }

    this.logAudit(
      actorName,
      "HOSPITAL_ADMIN",
      "UPDATE_DOCTOR_AVAILABILITY",
      `Doctor: ${doc.name}`,
      `Changed status to ${status}. Reason: ${reason || "None"}.`
    );

    return { doctor: doc, affectedAppointments };
  }

  // Reassign affected appointment to alternative doctor
  public reassignAppointment(
    appointmentId: string,
    newDoctorId: string,
    newTimeSlot?: string,
    actorName = "Admin"
  ): Appointment | null {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    const newDoc = this.doctors.find((d) => d.id === newDoctorId);
    if (!apt || !newDoc) return null;

    const prevDoctorName = apt.doctorName;
    apt.doctorId = newDoc.id;
    apt.doctorName = newDoc.name;
    apt.affectedByDoctorAbsence = false;
    apt.status = "CONFIRMED";
    if (newTimeSlot) {
      apt.expectedStartTime = newTimeSlot;
    }
    apt.notes = `Reassigned from ${prevDoctorName} to ${newDoc.name}. Patient notified via automated in-app message.`;

    // Also update any matching queue entry
    const qEntry = this.queues.find((q) => q.appointmentId === appointmentId);
    if (qEntry) {
      qEntry.doctorId = newDoc.id;
      qEntry.doctorName = newDoc.name;
      qEntry.roomNumber = newDoc.roomNumber;
    }

    this.logAudit(
      actorName,
      "HOSPITAL_ADMIN",
      "REASSIGN_APPOINTMENT",
      `Appointment: ${apt.referenceNumber}`,
      `Reassigned patient ${apt.patientName} from ${prevDoctorName} to ${newDoc.name}.`
    );

    socketClient.emitLocalEvent("APPOINTMENT_RESCHEDULED", { appointment: apt });

    return apt;
  }

  // Reschedule appointment to another date/time
  public rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    reason?: string,
    actorName = "Staff"
  ): Appointment | null {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return null;

    apt.appointmentDate = newDate;
    apt.expectedStartTime = newStartTime;
    apt.status = "RESCHEDULED";
    apt.affectedByDoctorAbsence = false;
    apt.notes = `Rescheduled to ${newDate} at ${newStartTime}. Reason: ${reason || "Staff initiated"}`;

    this.logAudit(
      actorName,
      "RECEPTION_STAFF",
      "RESCHEDULE_APPOINTMENT",
      `Appointment: ${apt.referenceNumber}`,
      `Rescheduled ${apt.patientName} to ${newDate} at ${newStartTime}.`
    );

    socketClient.emitLocalEvent("APPOINTMENT_RESCHEDULED", { appointment: apt });
    return apt;
  }

  // Calculate Operational Summary
  public getOperationsSummary(): OperationsSummary {
    const todayAppointments = this.appointments;
    const waiting = this.queues.filter((q) => q.status === "WAITING").length;
    const inConsult = this.queues.filter((q) => q.status === "IN_PROGRESS" || q.status === "CALLED").length;
    const completed = this.appointments.filter((a) => a.status === "COMPLETED").length;
    const delayed = this.appointments.filter((a) => a.status === "DELAYED" || a.affectedByDoctorAbsence).length;
    const noShow = this.appointments.filter((a) => a.status === "NO_SHOW").length;
    const availableDocs = this.doctors.filter((d) => d.availability === "AVAILABLE" || d.availability === "IN_CONSULTATION").length;

    return {
      todayAppointmentsCount: todayAppointments.length,
      waitingCount: waiting,
      inConsultationCount: inConsult,
      completedCount: completed,
      delayedCount: delayed,
      noShowCount: noShow,
      availableDoctorsCount: availableDocs,
      totalDoctorsCount: this.doctors.length,
      averageWaitTimeMinutes: 18,
      queueFairnessScore: 94,
      activeAlertsCount: this.alerts.filter((a) => !a.resolved).length,
    };
  }

  public getDepartmentWorkloads(): DepartmentWorkload[] {
    return this.departments.map((dept) => {
      const deptApts = this.appointments.filter((a) => a.departmentId === dept.id);
      const waiting = this.queues.filter((q) => q.departmentId === dept.id && q.status === "WAITING").length;
      const inConsult = this.queues.filter((q) => q.departmentId === dept.id && (q.status === "IN_PROGRESS" || q.status === "CALLED")).length;
      const completed = deptApts.filter((a) => a.status === "COMPLETED").length;
      const docs = this.doctors.filter((d) => d.departmentId === dept.id && d.availability !== "UNAVAILABLE" && d.availability !== "ON_LEAVE").length;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalToday: deptApts.length,
        waiting,
        inConsultation: inConsult,
        completed,
        avgWaitTime: dept.averageWaitTimeMinutes,
        status: dept.status === "DELAYED" ? "DELAYED" : dept.status === "OVERLOADED" ? "OVERLOADED" : "NORMAL",
        doctorsOnDuty: docs,
      };
    });
  }
}

export const mockDb = new MockHospitalDatabase();
