import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  HospitalRow, 
  DepartmentRow, 
  DoctorRow, 
  ProfileRow, 
  ServiceRow, 
  AppointmentRow, 
  QueueEntryRow, 
  JourneyRow, 
  JourneyStepRow, 
  NavigationLocationRow,
  NotificationRow,
  AuditLogRow,
  DoctorScheduleRow,
  JourneyTemplateRow,
  JourneyTemplateStepRow,
  QueueStatus,
  DoctorStatus,
  JourneyStepStatus,
  JourneyStatus
} from '../types/database.types';
import { EnrichedQueueEntry, DashboardStats, QueueFilters } from '../types/queue.types';
import { 
  DoctorDisruptionIncident, 
  BackendRescheduleAlternatives, 
  RescheduleActionPayload, 
  RescheduleResult, 
  AffectedAppointmentItem 
} from '../types/disruption.types';
import { AnalyticsTimeRange, AnalyticsData } from '../types/analytics.types';
import { 
  INITIAL_HOSPITALS, 
  INITIAL_PROFILES, 
  INITIAL_DEPARTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_SERVICES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_QUEUE_ENTRIES, 
  INITIAL_JOURNEYS, 
  INITIAL_JOURNEY_STEPS, 
  INITIAL_NAVIGATION_LOCATIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_DOCTOR_SCHEDULES,
  INITIAL_JOURNEY_TEMPLATES,
  INITIAL_JOURNEY_TEMPLATE_STEPS
} from './mockData';
import { realtimeManager } from '../realtime/realtimeManager';

// Local in-memory store for fallback / dev / testing
class LocalHospitalStore {
  hospitals = [...INITIAL_HOSPITALS];
  profiles = [...INITIAL_PROFILES];
  departments = [...INITIAL_DEPARTMENTS];
  doctors = [...INITIAL_DOCTORS];
  doctorSchedules = [...INITIAL_DOCTOR_SCHEDULES];
  services = [...INITIAL_SERVICES];
  appointments = [...INITIAL_APPOINTMENTS];
  queueEntries = [...INITIAL_QUEUE_ENTRIES];
  journeys = [...INITIAL_JOURNEYS];
  journeySteps = [...INITIAL_JOURNEY_STEPS];
  journeyTemplates = [...INITIAL_JOURNEY_TEMPLATES];
  journeyTemplateSteps = [...INITIAL_JOURNEY_TEMPLATE_STEPS];
  navigationLocations = [...INITIAL_NAVIGATION_LOCATIONS];
  notifications = [...INITIAL_NOTIFICATIONS];
  auditLogs = [...INITIAL_AUDIT_LOGS];
}

const localStore = new LocalHospitalStore();

// ============================================================================
// CENTRALIZED API & AUDIT SERVICE
// ============================================================================

export const apiService = {
  // --------------------------------------------------------------------------
  // AUDIT LOGGING HELPER
  // --------------------------------------------------------------------------
  async recordAuditLog(log: {
    actorId?: string | null;
    actorName?: string;
    role: string;
    hospitalId: string;
    action: string;
    resource: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const entry: AuditLogRow = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: log.actorId || null,
      actor_name: log.actorName || 'Hospital Admin',
      role: log.role || 'HOSPITAL_ADMIN',
      hospital_id: log.hospitalId,
      action: log.action,
      resource: log.resource,
      status: log.status || 'SUCCESS',
      timestamp: new Date().toISOString(),
      metadata: log.metadata || {},
    };

    if (isSupabaseConfigured) {
      await supabase.from('audit_logs').insert({
        actor_id: entry.actor_id,
        role: entry.role,
        hospital_id: entry.hospital_id,
        action: entry.action,
        resource: entry.resource,
        metadata: entry.metadata,
      });
    }

    localStore.auditLogs.unshift(entry);
  },

  async getAuditLogs(hospitalId: string): Promise<AuditLogRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles(name)')
        .eq('hospital_id', hospitalId)
        .order('timestamp', { ascending: false })
        .limit(100);
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          actor_name: item.actor?.name || 'Authorized Staff',
        }));
      }
    }
    return localStore.auditLogs.filter((a) => a.hospital_id === hospitalId);
  },

  // --------------------------------------------------------------------------
  // HOSPITALS
  // --------------------------------------------------------------------------
  async getHospitalById(id: string): Promise<HospitalRow | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return localStore.hospitals.find((h) => h.id === id) || null;
      return data;
    }
    return localStore.hospitals.find((h) => h.id === id) || localStore.hospitals[0];
  },

  async getAllHospitals(): Promise<HospitalRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('hospitals').select('*');
      if (!error && data) return data;
    }
    return localStore.hospitals;
  },

  async updateHospital(id: string, updates: Partial<HospitalRow>, actorId?: string): Promise<HospitalRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: id,
        action: 'HOSPITAL_SETTINGS_UPDATE',
        resource: 'hospitals',
        metadata: { updatedFields: Object.keys(updates) },
      });
      return data;
    }
    const idx = localStore.hospitals.findIndex((h) => h.id === id);
    if (idx !== -1) {
      localStore.hospitals[idx] = { 
        ...localStore.hospitals[idx], 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: id,
        action: 'HOSPITAL_SETTINGS_UPDATE',
        resource: 'hospitals',
        metadata: { updatedFields: Object.keys(updates) },
      });
      return localStore.hospitals[idx];
    }
    throw new Error('Hospital not found');
  },

  // --------------------------------------------------------------------------
  // PROFILES
  // --------------------------------------------------------------------------
  async getProfileById(userId: string): Promise<ProfileRow | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    }
    return localStore.profiles.find((p) => p.id === userId) || null;
  },

  // --------------------------------------------------------------------------
  // DEPARTMENTS (WITH DOCTOR AND SERVICE COUNTS)
  // --------------------------------------------------------------------------
  async getDepartments(hospitalId: string): Promise<DepartmentRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          doctors:doctors(count),
          services:services(count)
        `)
        .eq('hospital_id', hospitalId)
        .order('name');
      if (!error && data) {
        return data.map((d: any) => ({
          ...d,
          doctor_count: d.doctors?.[0]?.count ?? 0,
          service_count: d.services?.[0]?.count ?? 0,
        }));
      }
    }

    return localStore.departments
      .filter((d) => d.hospital_id === hospitalId)
      .map((d) => ({
        ...d,
        doctor_count: localStore.doctors.filter((doc) => doc.department_id === d.id && doc.status !== 'OFFLINE').length,
        service_count: localStore.services.filter((s) => s.department_id === d.id && s.status !== 'INACTIVE').length,
      }));
  },

  async getDepartmentById(deptId: string): Promise<DepartmentRow | null> {
    const list = await this.getDepartments('11111111-1111-1111-1111-111111111111');
    return list.find((d) => d.id === deptId) || null;
  },

  async createDepartment(
    dept: Omit<DepartmentRow, 'id'>, 
    actorId?: string
  ): Promise<DepartmentRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: dept.hospital_id,
        action: 'DEPARTMENT_CREATE',
        resource: 'departments',
        metadata: { name: dept.name, location: dept.location },
      });
      return data;
    }

    const newDept: DepartmentRow = {
      ...dept,
      id: `dept-${Date.now()}`,
      doctor_count: 0,
      service_count: 0,
    };
    localStore.departments.push(newDept);
    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: dept.hospital_id,
      action: 'DEPARTMENT_CREATE',
      resource: 'departments',
      metadata: { name: dept.name, location: dept.location },
    });
    return newDept;
  },

  async updateDepartment(
    deptId: string, 
    updates: Partial<DepartmentRow>, 
    actorId?: string
  ): Promise<DepartmentRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', deptId)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.hospital_id,
        action: 'DEPARTMENT_UPDATE',
        resource: 'departments',
        metadata: { departmentId: deptId, updates },
      });
      return data;
    }

    const idx = localStore.departments.findIndex((d) => d.id === deptId);
    if (idx !== -1) {
      localStore.departments[idx] = { ...localStore.departments[idx], ...updates };
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: localStore.departments[idx].hospital_id,
        action: 'DEPARTMENT_UPDATE',
        resource: 'departments',
        metadata: { departmentId: deptId, updates },
      });
      return localStore.departments[idx];
    }
    throw new Error('Department not found');
  },

  async deactivateDepartment(deptId: string, actorId?: string): Promise<void> {
    await this.updateDepartment(deptId, { status: 'INACTIVE' }, actorId);
  },

  // --------------------------------------------------------------------------
  // DOCTORS & AVAILABILITY
  // --------------------------------------------------------------------------
  async getDoctors(hospitalId: string): Promise<DoctorRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, profile:profiles(*), department:departments(*)')
        .eq('hospital_id', hospitalId);
      if (!error && data) return data as any;
    }

    return localStore.doctors
      .filter((d) => d.hospital_id === hospitalId)
      .map((doc) => ({
        ...doc,
        profile: localStore.profiles.find((p) => p.id === doc.user_id),
        department: localStore.departments.find((dep) => dep.id === doc.department_id),
      }));
  },

  async createDoctor(
    payload: {
      name: string;
      email: string;
      phone: string;
      department_id: string;
      specialization: string;
      status: DoctorStatus;
      hospital_id: string;
    },
    actorId?: string
  ): Promise<DoctorRow> {
    if (isSupabaseConfigured) {
      // 1. Insert profile
      const newUserId = crypto.randomUUID();
      const { error: profErr } = await supabase.from('profiles').insert({
        id: newUserId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: 'DOCTOR',
        hospital_id: payload.hospital_id,
      });
      if (profErr) throw profErr;

      // 2. Insert doctor
      const { data: docData, error: docErr } = await supabase
        .from('doctors')
        .insert({
          user_id: newUserId,
          hospital_id: payload.hospital_id,
          department_id: payload.department_id,
          specialization: payload.specialization,
          status: payload.status,
        })
        .select('*, profile:profiles(*), department:departments(*)')
        .single();
      if (docErr) throw docErr;

      // 3. Create Audit Log
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: payload.hospital_id,
        action: 'DOCTOR_CREATE',
        resource: 'doctors',
        metadata: { doctorName: payload.name, specialization: payload.specialization },
      });

      realtimeManager.broadcastLocalChange('doctors', docData as unknown as Record<string, unknown>);
      return docData as any;
    }

    // Local fallback store
    const newUserId = `p-${Date.now()}`;
    const newProfile: ProfileRow = {
      id: newUserId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: 'DOCTOR',
      hospital_id: payload.hospital_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStore.profiles.push(newProfile);

    const newDoctor: DoctorRow = {
      id: `doc-${Date.now()}`,
      user_id: newUserId,
      hospital_id: payload.hospital_id,
      department_id: payload.department_id,
      specialization: payload.specialization,
      status: payload.status,
      profile: newProfile,
      department: localStore.departments.find((d) => d.id === payload.department_id),
      assigned_services: [],
    };
    localStore.doctors.push(newDoctor);

    // Initial default schedule
    localStore.doctorSchedules.push({
      id: `sch-${Date.now()}`,
      doctor_id: newDoctor.id,
      date: new Date().toISOString().split('T')[0],
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '08:30',
      end_time: '16:30',
      break_periods: [{ start: '12:30', end: '13:15' }],
      availability_status: 'AVAILABLE',
    });

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: payload.hospital_id,
      action: 'DOCTOR_CREATE',
      resource: 'doctors',
      metadata: { doctorName: payload.name, specialization: payload.specialization },
    });

    realtimeManager.broadcastLocalChange('doctors', newDoctor as unknown as Record<string, unknown>);
    return newDoctor;
  },

  async updateDoctor(
    doctorId: string, 
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      department_id: string;
      specialization: string;
      status: DoctorStatus;
      assigned_services: string[];
    }>,
    actorId?: string
  ): Promise<DoctorRow> {
    if (isSupabaseConfigured) {
      const docUpdates: any = {};
      if (payload.department_id) docUpdates.department_id = payload.department_id;
      if (payload.specialization) docUpdates.specialization = payload.specialization;
      if (payload.status) docUpdates.status = payload.status;

      const { data, error } = await supabase
        .from('doctors')
        .update(docUpdates)
        .eq('id', doctorId)
        .select('*, profile:profiles(*), department:departments(*)')
        .single();
      if (error) throw error;

      if (payload.name || payload.email || payload.phone) {
        await supabase
          .from('profiles')
          .update({
            ...(payload.name && { name: payload.name }),
            ...(payload.email && { email: payload.email }),
            ...(payload.phone && { phone: payload.phone }),
          })
          .eq('id', data.user_id);
      }

      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.hospital_id,
        action: 'DOCTOR_UPDATE',
        resource: 'doctors',
        metadata: { doctorId, updates: payload },
      });

      realtimeManager.broadcastLocalChange('doctors', data as unknown as Record<string, unknown>);
      return data as any;
    }

    const idx = localStore.doctors.findIndex((d) => d.id === doctorId);
    if (idx !== -1) {
      const doc = localStore.doctors[idx];
      if (payload.department_id) doc.department_id = payload.department_id;
      if (payload.specialization) doc.specialization = payload.specialization;
      if (payload.status) doc.status = payload.status;
      if (payload.assigned_services) doc.assigned_services = payload.assigned_services;

      const prof = localStore.profiles.find((p) => p.id === doc.user_id);
      if (prof) {
        if (payload.name) prof.name = payload.name;
        if (payload.email) prof.email = payload.email;
        if (payload.phone) prof.phone = payload.phone;
      }

      doc.profile = prof;
      doc.department = localStore.departments.find((d) => d.id === doc.department_id);

      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: doc.hospital_id,
        action: 'DOCTOR_UPDATE',
        resource: 'doctors',
        metadata: { doctorId, updates: payload },
      });

      realtimeManager.broadcastLocalChange('doctors', doc as unknown as Record<string, unknown>);
      return doc;
    }
    throw new Error('Doctor not found');
  },

  async updateDoctorStatus(doctorId: string, status: DoctorStatus, actorId?: string): Promise<DoctorRow> {
    return this.updateDoctor(doctorId, { status }, actorId);
  },

  async deactivateDoctor(doctorId: string, actorId?: string): Promise<DoctorRow> {
    return this.updateDoctor(doctorId, { status: 'OFFLINE' }, actorId);
  },

  // --------------------------------------------------------------------------
  // DOCTOR SCHEDULES
  // --------------------------------------------------------------------------
  async getDoctorSchedule(doctorId: string): Promise<DoctorScheduleRow | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) return data;
    }
    return localStore.doctorSchedules.find((s) => s.doctor_id === doctorId) || null;
  },

  async saveDoctorSchedule(
    doctorId: string, 
    schedule: Omit<DoctorScheduleRow, 'id' | 'doctor_id'>, 
    actorId?: string
  ): Promise<DoctorScheduleRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .upsert({
          doctor_id: doctorId,
          ...schedule,
        })
        .select()
        .single();
      if (error) throw error;

      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: '11111111-1111-1111-1111-111111111111',
        action: 'DOCTOR_SCHEDULE_CONFIG',
        resource: 'doctor_schedules',
        metadata: { doctorId, schedule },
      });

      realtimeManager.broadcastLocalChange('doctor_schedules', data as unknown as Record<string, unknown>);
      return data;
    }

    const idx = localStore.doctorSchedules.findIndex((s) => s.doctor_id === doctorId);
    let updated: DoctorScheduleRow;
    if (idx !== -1) {
      localStore.doctorSchedules[idx] = {
        ...localStore.doctorSchedules[idx],
        ...schedule,
      };
      updated = localStore.doctorSchedules[idx];
    } else {
      updated = {
        id: `sch-${Date.now()}`,
        doctor_id: doctorId,
        ...schedule,
      };
      localStore.doctorSchedules.push(updated);
    }

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: '11111111-1111-1111-1111-111111111111',
      action: 'DOCTOR_SCHEDULE_CONFIG',
      resource: 'doctor_schedules',
      metadata: { doctorId, schedule },
    });

    realtimeManager.broadcastLocalChange('doctor_schedules', updated as unknown as Record<string, unknown>);
    return updated;
  },

  // --------------------------------------------------------------------------
  // SERVICES
  // --------------------------------------------------------------------------
  async getServices(hospitalId: string): Promise<ServiceRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('services')
        .select('*, department:departments!inner(*)')
        .eq('department.hospital_id', hospitalId);
      if (!error && data) return data as any;
    }

    const depts = localStore.departments.filter((d) => d.hospital_id === hospitalId);
    const deptIds = new Set(depts.map((d) => d.id));
    return localStore.services
      .filter((s) => deptIds.has(s.department_id))
      .map((s) => ({
        ...s,
        department: localStore.departments.find((d) => d.id === s.department_id),
      }));
  },

  async createService(service: Omit<ServiceRow, 'id'>, actorId?: string): Promise<ServiceRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select('*, department:departments(*)')
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.department?.hospital_id || '11111111-1111-1111-1111-111111111111',
        action: 'SERVICE_CREATE',
        resource: 'services',
        metadata: { name: service.name, duration: service.expected_duration },
      });
      return data as any;
    }

    const newService: ServiceRow = {
      ...service,
      id: `s-${Date.now()}`,
      department: localStore.departments.find((d) => d.id === service.department_id),
    };
    localStore.services.push(newService);

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: newService.department?.hospital_id || '11111111-1111-1111-1111-111111111111',
      action: 'SERVICE_CREATE',
      resource: 'services',
      metadata: { name: service.name, duration: service.expected_duration },
    });

    return newService;
  },

  async updateService(
    serviceId: string, 
    updates: Partial<ServiceRow>, 
    actorId?: string
  ): Promise<ServiceRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select('*, department:departments(*)')
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.department?.hospital_id || '11111111-1111-1111-1111-111111111111',
        action: 'SERVICE_UPDATE',
        resource: 'services',
        metadata: { serviceId, updates },
      });
      return data as any;
    }

    const idx = localStore.services.findIndex((s) => s.id === serviceId);
    if (idx !== -1) {
      localStore.services[idx] = { ...localStore.services[idx], ...updates };
      if (updates.department_id) {
        localStore.services[idx].department = localStore.departments.find(
          (d) => d.id === updates.department_id
        );
      }
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: localStore.services[idx].department?.hospital_id || '11111111-1111-1111-1111-111111111111',
        action: 'SERVICE_UPDATE',
        resource: 'services',
        metadata: { serviceId, updates },
      });
      return localStore.services[idx];
    }
    throw new Error('Service not found');
  },

  async deactivateService(serviceId: string, actorId?: string): Promise<void> {
    await this.updateService(serviceId, { status: 'INACTIVE' }, actorId);
  },

  // --------------------------------------------------------------------------
  // APPOINTMENTS (TABS & MULTI-FILTER)
  // --------------------------------------------------------------------------
  async getAppointments(
    hospitalId: string, 
    filters?: {
      date?: string;
      tab?: 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW' | 'ALL';
      departmentId?: string;
      doctorId?: string;
      serviceId?: string;
      status?: string;
      search?: string;
    }
  ): Promise<AppointmentRow[]> {
    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured) {
      let query = supabase
        .from('appointments')
        .select('*, doctor:doctors(*, profile:profiles(*)), department:departments(*), service:services(*)')
        .eq('hospital_id', hospitalId)
        .order('expected_start', { ascending: true });

      if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);
      if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
      if (filters?.serviceId) query = query.eq('service_id', filters.serviceId);
      if (filters?.date) query = query.eq('appointment_date', filters.date);

      const { data, error } = await query;
      if (!error && data) return data as any;
    }

    // Local filtering
    let list = localStore.appointments
      .filter((a) => a.hospital_id === hospitalId)
      .map((a) => {
        const doc = localStore.doctors.find((d) => d.id === a.doctor_id);
        const docProfile = doc ? localStore.profiles.find((p) => p.id === doc.user_id) : undefined;
        return {
          ...a,
          doctor: doc ? { ...doc, profile: docProfile } : undefined,
          department: localStore.departments.find((d) => d.id === a.department_id),
          service: localStore.services.find((s) => s.id === a.service_id),
        };
      });

    // Apply Tab logic
    if (filters?.tab && filters.tab !== 'ALL') {
      switch (filters.tab) {
        case 'TODAY':
          list = list.filter((a) => a.appointment_date === today);
          break;
        case 'UPCOMING':
          list = list.filter((a) => a.appointment_date > today && a.status !== 'CANCELLED');
          break;
        case 'COMPLETED':
          list = list.filter((a) => a.status === 'COMPLETED');
          break;
        case 'CANCELLED':
          list = list.filter((a) => a.status === 'CANCELLED');
          break;
        case 'NO_SHOW':
          list = list.filter((a) => a.status === 'NO_SHOW');
          break;
        case 'RESCHEDULED':
          list = list.filter((a) => a.status === 'CONFIRMED' && a.appointment_date > today);
          break;
      }
    }

    if (filters?.date) {
      list = list.filter((a) => a.appointment_date === filters.date);
    }
    if (filters?.departmentId) {
      list = list.filter((a) => a.department_id === filters.departmentId);
    }
    if (filters?.doctorId) {
      list = list.filter((a) => a.doctor_id === filters.doctorId);
    }
    if (filters?.serviceId) {
      list = list.filter((a) => a.service_id === filters.serviceId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.patient_name?.toLowerCase().includes(s) ||
          a.patient_phone?.toLowerCase().includes(s) ||
          a.doctor?.profile?.name?.toLowerCase().includes(s)
      );
    }

    return list;
  },

  async getAppointmentById(id: string): Promise<any> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(*, profile:profiles(*)), department:departments(*), service:services(*), queue_entry:queue_entries(*), journey:journeys(*, steps:journey_steps(*))')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    }

    const apt = localStore.appointments.find((a) => a.id === id);
    if (!apt) return null;
    const doc = localStore.doctors.find((d) => d.id === apt.doctor_id);
    const qEntry = localStore.queueEntries.find((q) => q.appointment_id === apt.id);
    const journey = localStore.journeys.find((j) => j.appointment_id === apt.id);
    const journeySteps = journey ? localStore.journeySteps.filter((js) => js.journey_id === journey.id) : [];

    return {
      ...apt,
      doctor: doc ? { ...doc, profile: localStore.profiles.find((p) => p.id === doc.user_id) } : undefined,
      department: localStore.departments.find((d) => d.id === apt.department_id),
      service: localStore.services.find((s) => s.id === apt.service_id),
      queue_entry: qEntry,
      journey: journey ? { ...journey, steps: journeySteps } : undefined,
    };
  },

  async updateAppointment(
    id: string,
    updates: Partial<AppointmentRow>,
    actorId?: string
  ): Promise<AppointmentRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.hospital_id,
        action: updates.status ? `APPOINTMENT_${updates.status}` : 'APPOINTMENT_UPDATE',
        resource: 'appointments',
        metadata: { appointmentId: id, updates },
      });

      realtimeManager.broadcastLocalChange('appointments', data as unknown as Record<string, unknown>);
      return data;
    }

    const idx = localStore.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localStore.appointments[idx] = {
        ...localStore.appointments[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const apt = localStore.appointments[idx];

      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: apt.hospital_id,
        action: updates.status ? `APPOINTMENT_${updates.status}` : 'APPOINTMENT_UPDATE',
        resource: 'appointments',
        metadata: { appointmentId: id, updates },
      });

      realtimeManager.broadcastLocalChange('appointments', apt as unknown as Record<string, unknown>);
      return apt;
    }
    throw new Error('Appointment not found');
  },

  // --------------------------------------------------------------------------
  // QUEUE ENTRIES
  // --------------------------------------------------------------------------
  async getQueueEntries(hospitalId: string, filters?: QueueFilters): Promise<EnrichedQueueEntry[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('queue_entries')
        .select(`
          *,
          appointment:appointments!inner(
            *,
            department:departments(*),
            doctor:doctors(*, profile:profiles(*)),
            service:services(*),
            journey:journeys(*, steps:journey_steps(*))
          )
        `)
        .eq('appointment.hospital_id', hospitalId)
        .order('position', { ascending: true });

      if (filters?.departmentId) query = query.eq('appointment.department_id', filters.departmentId);
      if (filters?.doctorId) query = query.eq('appointment.doctor_id', filters.doctorId);
      if (filters?.status && filters.status !== 'ALL') query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (!error && data) return data as any;
    }

    let results: EnrichedQueueEntry[] = localStore.queueEntries.map((q) => {
      const apt = localStore.appointments.find((a) => a.id === q.appointment_id);
      if (!apt || apt.hospital_id !== hospitalId) return null as any;

      const doc = localStore.doctors.find((d) => d.id === apt.doctor_id);
      const journey = localStore.journeys.find((j) => j.appointment_id === apt.id);
      const journeySteps = journey ? localStore.journeySteps.filter((s) => s.journey_id === journey.id) : [];

      return {
        ...q,
        appointment: {
          ...apt,
          department: localStore.departments.find((d) => d.id === apt.department_id),
          doctor: doc ? { ...doc, profile: localStore.profiles.find((p) => p.id === doc.user_id) } : undefined,
          service: localStore.services.find((s) => s.id === apt.service_id),
          journey: journey ? { ...journey, steps: journeySteps } : undefined,
        },
      };
    }).filter(Boolean);

    if (filters?.departmentId) {
      results = results.filter((q) => q.appointment?.department_id === filters.departmentId);
    }
    if (filters?.doctorId) {
      results = results.filter((q) => q.appointment?.doctor_id === filters.doctorId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((q) => q.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(
        (entry) =>
          entry.queue_reference.toLowerCase().includes(q) ||
          entry.appointment?.patient_name?.toLowerCase().includes(q)
      );
    }

    return results;
  },

  // --------------------------------------------------------------------------
  // QUEUE OPERATIONS & STATE MACHINE ENFORCEMENT
  // --------------------------------------------------------------------------
  async updateQueueStatus(
    queueId: string,
    status: QueueStatus,
    actorId?: string,
    role: string = 'HOSPITAL_STAFF'
  ): Promise<QueueEntryRow> {
    const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
      WAITING: ['CALLED', 'SKIPPED', 'CANCELLED', 'TRANSFERRED'],
      CALLED: ['IN_PROGRESS', 'NO_SHOW', 'SKIPPED', 'WAITING'],
      IN_PROGRESS: ['COMPLETED', 'TRANSFERRED', 'CANCELLED'],
      SKIPPED: ['WAITING', 'CALLED', 'CANCELLED'],
      NO_SHOW: ['WAITING'], // Reopen
      TRANSFERRED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    let currentEntry: QueueEntryRow | null = null;
    let appointment: AppointmentRow | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*, appointment:appointments(*)')
        .eq('id', queueId)
        .single();
      if (error || !data) throw new Error('Queue entry not found');
      currentEntry = data;
      appointment = data.appointment;
    } else {
      currentEntry = localStore.queueEntries.find((q) => q.id === queueId) || null;
      if (!currentEntry) throw new Error('Queue entry not found');
      appointment = localStore.appointments.find((a) => a.id === currentEntry!.appointment_id) || null;
    }

    if (!currentEntry) {
      throw new Error('Queue entry not found');
    }

    const currentStatus = currentEntry.status;

    // Verify valid state transition
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status) && currentStatus !== status) {
      throw new Error(
        `Invalid queue transition: cannot transition from ${currentStatus} to ${status}. Allowed: ${
          allowed.join(', ') || 'None (Terminal state)'
        }`
      );
    }

    const timestamp = new Date().toISOString();
    const updatePayload: Partial<QueueEntryRow> = { status };
    if (status === 'CALLED') updatePayload.called_at = timestamp;
    else if (status === 'IN_PROGRESS') updatePayload.started_at = timestamp;
    else if (status === 'COMPLETED') updatePayload.completed_at = timestamp;

    let updatedResult: QueueEntryRow;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .update(updatePayload)
        .eq('id', queueId)
        .select()
        .single();
      if (error) throw error;
      updatedResult = data;
    } else {
      const idx = localStore.queueEntries.findIndex((q) => q.id === queueId);
      localStore.queueEntries[idx] = {
        ...localStore.queueEntries[idx],
        ...updatePayload,
      };
      updatedResult = localStore.queueEntries[idx];
    }

    // Sync appointment status where appropriate
    if (appointment) {
      if (status === 'IN_PROGRESS') {
        await this.updateAppointment(appointment.id, { status: 'IN_PROGRESS' }, actorId);
      } else if (status === 'COMPLETED') {
        await this.updateAppointment(appointment.id, { status: 'COMPLETED' }, actorId);
      } else if (status === 'NO_SHOW') {
        await this.updateAppointment(appointment.id, { status: 'NO_SHOW' }, actorId);
      }
    }

    // Record audit log
    const actionMap: Record<QueueStatus, string> = {
      CALLED: 'CALL_PATIENT',
      IN_PROGRESS: 'START_CONSULTATION',
      COMPLETED: 'COMPLETE_CONSULTATION',
      SKIPPED: 'SKIP_PATIENT',
      NO_SHOW: 'NO_SHOW_PATIENT',
      CANCELLED: 'CANCEL_QUEUE',
      TRANSFERRED: 'TRANSFER_PATIENT',
      WAITING: 'REQUEUE_PATIENT',
    };

    const hid = appointment?.hospital_id || '11111111-1111-1111-1111-111111111111';
    await this.recordAuditLog({
      actorId,
      role,
      hospitalId: hid,
      action: actionMap[status] || 'QUEUE_STATUS_UPDATE',
      resource: 'queue_entries',
      metadata: {
        queueId,
        token: updatedResult.queue_reference,
        fromStatus: currentStatus,
        toStatus: status,
      },
    });

    realtimeManager.broadcastLocalChange('queue_entries', updatedResult as unknown as Record<string, unknown>);
    return updatedResult;
  },

  async callNextPatient(
    hospitalId: string,
    departmentId?: string,
    doctorId?: string,
    actorId?: string,
    role: string = 'HOSPITAL_STAFF'
  ): Promise<QueueEntryRow> {
    const entries = await this.getQueueEntries(hospitalId, {
      departmentId,
      doctorId,
      status: 'WAITING',
    });

    if (entries.length === 0) {
      throw new Error('No waiting patients in queue for the selected filters.');
    }

    // Server authoritative ordering: sort by position ascending
    const nextPatient = entries.sort((a, b) => a.position - b.position)[0];
    return this.updateQueueStatus(nextPatient.id, 'CALLED', actorId, role);
  },

  async checkInPatient(
    appointmentId: string,
    actorId?: string,
    role: string = 'HOSPITAL_STAFF'
  ): Promise<QueueEntryRow> {
    const apt = await this.getAppointmentById(appointmentId);
    if (!apt) throw new Error('Appointment not found');

    if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
      throw new Error(`Cannot check in an appointment that is already ${apt.status}`);
    }

    if (apt.queue_entry && apt.queue_entry.status !== 'CANCELLED') {
      throw new Error(`Patient is already checked in with Token: ${apt.queue_entry.queue_reference}`);
    }

    const hospitalId = apt.hospital_id;
    const existingQueue = await this.getQueueEntries(hospitalId, {
      departmentId: apt.department_id,
    });

    // Server-assigned position: max(position) + 1
    const maxPosition = existingQueue.reduce((max, q) => Math.max(max, q.position), 0);
    const assignedPosition = maxPosition + 1;

    // Generate token based on department prefix
    const dept = apt.department || localStore.departments.find((d) => d.id === apt.department_id);
    const deptPrefix = dept?.name
      ? dept.name.includes('OB')
        ? 'OB'
        : dept.name.includes('Cardio')
        ? 'CD'
        : dept.name.includes('Neuro')
        ? 'NE'
        : dept.name.includes('Ortho')
        ? 'OR'
        : 'OPD'
      : 'TK';

    const token = `${deptPrefix}-${100 + assignedPosition}`;
    const waitingAhead = existingQueue.filter((q) => q.status === 'WAITING' || q.status === 'CALLED').length;
    const estimatedWait = Math.max(5, waitingAhead * 15);

    const newEntry: QueueEntryRow = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointment_id: appointmentId,
      queue_reference: token,
      position: assignedPosition,
      status: 'WAITING',
      estimated_wait: estimatedWait,
      called_at: null,
      started_at: null,
      completed_at: null,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .insert(newEntry)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('appointments').update({ status: 'CHECKED_IN' }).eq('id', appointmentId);
    } else {
      localStore.queueEntries.push(newEntry);
      const aIdx = localStore.appointments.findIndex((a) => a.id === appointmentId);
      if (aIdx !== -1) {
        localStore.appointments[aIdx].status = 'CHECKED_IN';
      }
    }

    // Record audit log
    await this.recordAuditLog({
      actorId,
      role,
      hospitalId,
      action: 'PATIENT_CHECK_IN',
      resource: 'queue_entries',
      metadata: {
        appointmentId,
        token: newEntry.queue_reference,
        position: assignedPosition,
        department: dept?.name,
      },
    });

    realtimeManager.broadcastLocalChange('queue_entries', newEntry as unknown as Record<string, unknown>);
    realtimeManager.broadcastLocalChange('appointments', { id: appointmentId, status: 'CHECKED_IN' });

    return newEntry;
  },

  async transferPatient(
    queueId: string,
    targetDepartmentId: string,
    targetDoctorId?: string,
    actorId?: string,
    role: string = 'HOSPITAL_STAFF'
  ): Promise<{ fromQueue: QueueEntryRow; toQueue: QueueEntryRow }> {
    const fromQueue = await this.updateQueueStatus(queueId, 'TRANSFERRED', actorId, role);
    const apt = await this.getAppointmentById(fromQueue.appointment_id);
    if (!apt) throw new Error('Appointment not found for queue transfer');

    const hospitalId = apt.hospital_id;

    // Update appointment
    await this.updateAppointment(
      apt.id,
      {
        department_id: targetDepartmentId,
        doctor_id: targetDoctorId || null,
        status: 'CHECKED_IN',
      },
      actorId
    );

    // Compute next position in target department
    const targetQueue = await this.getQueueEntries(hospitalId, {
      departmentId: targetDepartmentId,
    });
    const maxPosition = targetQueue.reduce((max, q) => Math.max(max, q.position), 0);
    const assignedPosition = maxPosition + 1;

    const targetDept = localStore.departments.find((d) => d.id === targetDepartmentId);
    const deptPrefix = targetDept?.name
      ? targetDept.name.includes('OB')
        ? 'OB'
        : targetDept.name.includes('Cardio')
        ? 'CD'
        : targetDept.name.includes('Neuro')
        ? 'NE'
        : targetDept.name.includes('Ortho')
        ? 'OR'
        : 'OPD'
      : 'TR';

    const token = `${deptPrefix}-${200 + assignedPosition}`;
    const waitingAhead = targetQueue.filter((q) => q.status === 'WAITING' || q.status === 'CALLED').length;
    const estimatedWait = Math.max(5, waitingAhead * 15);

    const toQueue: QueueEntryRow = {
      id: `q-tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointment_id: apt.id,
      queue_reference: token,
      position: assignedPosition,
      status: 'WAITING',
      estimated_wait: estimatedWait,
      called_at: null,
      started_at: null,
      completed_at: null,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .insert(toQueue)
        .select()
        .single();
      if (error) throw error;
    } else {
      localStore.queueEntries.push(toQueue);
    }

    await this.recordAuditLog({
      actorId,
      role,
      hospitalId,
      action: 'TRANSFER_PATIENT',
      resource: 'queue_entries',
      metadata: {
        originalQueueId: queueId,
        newQueueId: toQueue.id,
        newDepartment: targetDept?.name,
        newDoctorId: targetDoctorId,
        newToken: toQueue.queue_reference,
      },
    });

    realtimeManager.broadcastLocalChange('queue_entries', toQueue as unknown as Record<string, unknown>);
    return { fromQueue, toQueue };
  },


  // --------------------------------------------------------------------------
  // DASHBOARD STATISTICS
  // --------------------------------------------------------------------------
  async getDashboardStats(hospitalId: string): Promise<DashboardStats> {
    const queueList = await this.getQueueEntries(hospitalId);
    const doctors = await this.getDoctors(hospitalId);
    const depts = await this.getDepartments(hospitalId);

    const todayAppointments = queueList.length;
    const waitingPatients = queueList.filter((q) => q.status === 'WAITING').length;
    const activeQueues = new Set(
      queueList.filter((q) => q.status === 'WAITING' || q.status === 'IN_PROGRESS' || q.status === 'CALLED')
        .map((q) => q.appointment?.department_id)
    ).size;
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;
    const unavailableDoctors = doctors.filter((d) => d.status !== 'AVAILABLE').length;
    const activeConsultations = queueList.filter((q) => q.status === 'IN_PROGRESS').length;
    const completedConsultations = queueList.filter((q) => q.status === 'COMPLETED').length;
    const noShows = queueList.filter((q) => q.status === 'NO_SHOW').length;

    const waitTimes = queueList
      .filter((q) => q.estimated_wait > 0)
      .map((q) => q.estimated_wait);
    const avgWaitingTimeMinutes = waitTimes.length
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 18;

    const departmentWorkload = depts.map((d) => {
      const deptEntries = queueList.filter((q) => q.appointment?.department_id === d.id);
      return {
        departmentName: d.name.split('(')[0].trim(),
        total: deptEntries.length,
        waiting: deptEntries.filter((q) => q.status === 'WAITING').length,
        inProgress: deptEntries.filter((q) => q.status === 'IN_PROGRESS').length,
        completed: deptEntries.filter((q) => q.status === 'COMPLETED').length,
      };
    });

    const alerts = [
      {
        id: 'alt-1',
        type: 'WARNING' as const,
        title: 'Queue Surge Alert',
        message: 'OB/GYN OPD waiting room reaching 80% capacity.',
        timestamp: '10 mins ago',
      },
      {
        id: 'alt-2',
        type: 'CRITICAL' as const,
        title: 'Emergency Delay Reported',
        message: 'Dr. Rajesh Kumar called into emergency coronary intervention.',
        timestamp: '25 mins ago',
      },
      {
        id: 'alt-3',
        type: 'INFO' as const,
        title: 'Realtime Sync Active',
        message: 'Central token queue synchronizing across all OPD counters.',
        timestamp: 'Just now',
      },
    ];

    return {
      todayAppointments,
      waitingPatients,
      activeQueues,
      availableDoctors,
      unavailableDoctors,
      activeConsultations,
      completedConsultations,
      noShows,
      avgWaitingTimeMinutes,
      departmentWorkload,
      alerts,
    };
  },

  // --------------------------------------------------------------------------
  // ADVANCED ANALYTICS (KPIs & RECHARTS TIME SERIES)
  // --------------------------------------------------------------------------
  async getAnalyticsData(hospitalId: string, range: AnalyticsTimeRange = 'today'): Promise<AnalyticsData> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let startDate = todayStr;
    let endDate = todayStr;

    if (range === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      startDate = d.toISOString().split('T')[0];
    } else if (range === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      startDate = d.toISOString().split('T')[0];
    }

    let apts: any[] = [];
    let queueEntries: any[] = [];
    let doctors: any[] = [];
    let departments: any[] = [];
    let services: any[] = [];

    if (isSupabaseConfigured) {
      // 1. Efficient query: retrieve only necessary columns and bounded date range
      const { data: rawApts } = await supabase
        .from('appointments')
        .select('id, department_id, doctor_id, service_id, status, appointment_date, expected_start, created_at')
        .eq('hospital_id', hospitalId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate);
      apts = rawApts || [];

      const aptIds = apts.map((a: any) => a.id);
      if (aptIds.length > 0) {
        const { data: rawQ } = await supabase
          .from('queue_entries')
          .select('id, appointment_id, status, estimated_wait, called_at, started_at, completed_at')
          .in('appointment_id', aptIds);
        queueEntries = rawQ || [];
      }

      const { data: rawDocs } = await supabase
        .from('doctors')
        .select('id, user_id, specialization, status, department_id, profile:profiles(name)')
        .eq('hospital_id', hospitalId);
      doctors = rawDocs || [];

      const { data: rawDepts } = await supabase
        .from('departments')
        .select('id, name')
        .eq('hospital_id', hospitalId);
      departments = rawDepts || [];

      const { data: rawServices } = await supabase
        .from('services')
        .select('id, name, department_id')
        .eq('hospital_id', hospitalId);
      services = rawServices || [];
    } else {
      // Local store fallback
      apts = localStore.appointments.filter(
        (a) => a.hospital_id === hospitalId && a.appointment_date >= startDate && a.appointment_date <= endDate
      );
      const aptIds = new Set(apts.map((a) => a.id));
      queueEntries = localStore.queueEntries.filter((q) => aptIds.has(q.appointment_id));
      doctors = localStore.doctors
        .filter((d) => d.hospital_id === hospitalId)
        .map((d) => ({
          ...d,
          profile: localStore.profiles.find((p) => p.id === d.user_id),
        }));
      departments = localStore.departments.filter((d) => d.hospital_id === hospitalId);
      services = localStore.services.filter((s) => departments.some((dept) => dept.id === s.department_id));
    }

    // 1. KPI Aggregation
    const appointmentsCount = apts.length;
    const completedConsultations = apts.filter((a) => a.status === 'COMPLETED').length;
    const activeConsultations = apts.filter((a) => a.status === 'IN_PROGRESS').length;
    const noShowCount = apts.filter((a) => a.status === 'NO_SHOW').length;
    const noShowRate = appointmentsCount > 0 ? Number(((noShowCount / appointmentsCount) * 100).toFixed(1)) : 0;
    const waitingPatients = queueEntries.filter((q) => q.status === 'WAITING' || q.status === 'CALLED').length;

    const waitTimes = queueEntries
      .map((q) => {
        if (q.started_at && q.called_at) {
          const diff = Math.round((new Date(q.started_at).getTime() - new Date(q.called_at).getTime()) / 60000);
          return diff > 0 ? diff : q.estimated_wait;
        }
        return q.estimated_wait;
      })
      .filter((w) => w > 0);

    const avgWaitingTimeMinutes = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((acc, val) => acc + val, 0) / waitTimes.length)
      : 18;

    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;

    const activeWorkload = waitingPatients + activeConsultations;
    const capacity = Math.max(totalDoctors * 4, 1);
    const queueUtilization = Math.min(100, Math.max(12, Math.round((activeWorkload / capacity) * 100)));

    // 2. Appointments by Department
    const appointmentsByDepartment = departments.map((dept) => {
      const deptApts = apts.filter((a) => a.department_id === dept.id);
      const deptQ = queueEntries.filter((q) => {
        const apt = apts.find((a) => a.id === q.appointment_id);
        return apt?.department_id === dept.id;
      });

      return {
        departmentId: dept.id,
        departmentName: dept.name.split('(')[0].trim(),
        count: deptApts.length,
        completed: deptApts.filter((a) => a.status === 'COMPLETED').length,
        waiting: deptQ.filter((q) => q.status === 'WAITING').length,
      };
    });

    // 3. Time Series Metrics (Over Time, Waiting Time, Completed, No-Show)
    const timeSeriesMap: { [key: string]: { appointments: number; completed: number; noShows: number; waitSum: number; waitCount: number } } = {};
    const labels: string[] = [];

    if (range === 'today') {
      const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      hours.forEach((h) => {
        labels.push(h);
        timeSeriesMap[h] = { appointments: 0, completed: 0, noShows: 0, waitSum: 0, waitCount: 0 };
      });

      apts.forEach((a) => {
        const dateObj = new Date(a.expected_start || a.created_at);
        const hour = dateObj.getUTCHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        if (timeSeriesMap[hourKey]) {
          timeSeriesMap[hourKey].appointments += 1;
          if (a.status === 'COMPLETED') timeSeriesMap[hourKey].completed += 1;
          if (a.status === 'NO_SHOW') timeSeriesMap[hourKey].noShows += 1;
        }
      });

      queueEntries.forEach((q) => {
        const dateObj = new Date(q.called_at || q.started_at || now.toISOString());
        const hour = dateObj.getUTCHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        if (timeSeriesMap[hourKey] && q.estimated_wait > 0) {
          timeSeriesMap[hourKey].waitSum += q.estimated_wait;
          timeSeriesMap[hourKey].waitCount += 1;
        }
      });
    } else {
      // Days generator
      const numDays = range === '7d' ? 7 : 30;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(dayLabel);
        timeSeriesMap[dateStr] = { appointments: 0, completed: 0, noShows: 0, waitSum: 0, waitCount: 0 };
        // Store alias for dayLabel
        (timeSeriesMap as any)[`label_${dateStr}`] = dayLabel;
      }

      apts.forEach((a) => {
        const dateStr = a.appointment_date || a.created_at?.split('T')[0];
        if (timeSeriesMap[dateStr]) {
          timeSeriesMap[dateStr].appointments += 1;
          if (a.status === 'COMPLETED') timeSeriesMap[dateStr].completed += 1;
          if (a.status === 'NO_SHOW') timeSeriesMap[dateStr].noShows += 1;
        }
      });

      queueEntries.forEach((q) => {
        const apt = apts.find((a) => a.id === q.appointment_id);
        const dateStr = apt?.appointment_date || apt?.created_at?.split('T')[0];
        if (dateStr && timeSeriesMap[dateStr] && q.estimated_wait > 0) {
          timeSeriesMap[dateStr].waitSum += q.estimated_wait;
          timeSeriesMap[dateStr].waitCount += 1;
        }
      });
    }

    const timeSeriesMetrics = Object.keys(timeSeriesMap)
      .filter((k) => !k.startsWith('label_'))
      .map((key) => {
        const item = timeSeriesMap[key];
        const label = (timeSeriesMap as any)[`label_${key}`] || key;
        const avgWait = item.waitCount > 0 ? Math.round(item.waitSum / item.waitCount) : (avgWaitingTimeMinutes || 15);

        return {
          timeLabel: label,
          appointments: item.appointments,
          completed: item.completed,
          noShows: item.noShows,
          avgWaitTime: avgWait,
        };
      });

    // 4. Doctor Workload
    const doctorWorkload = doctors.map((doc) => {
      const docApts = apts.filter((a) => a.doctor_id === doc.id);
      const name = doc.profile?.name || `Dr. ${doc.specialization}`;

      return {
        doctorId: doc.id,
        doctorName: name,
        specialization: doc.specialization,
        completed: docApts.filter((a) => a.status === 'COMPLETED').length,
        active: docApts.filter((a) => a.status === 'IN_PROGRESS').length,
        scheduled: docApts.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN').length,
        total: docApts.length,
      };
    }).sort((a, b) => b.total - a.total);

    // 5. Service Utilization
    const totalServiceApts = apts.filter((a) => a.service_id).length || 1;
    const serviceUtilization = services.map((svc) => {
      const count = apts.filter((a) => a.service_id === svc.id).length;
      const dept = departments.find((d) => d.id === svc.department_id);

      return {
        serviceId: svc.id,
        serviceName: svc.name,
        departmentName: dept?.name.split('(')[0].trim() || 'OPD',
        count,
        percentage: Number(((count / totalServiceApts) * 100).toFixed(1)),
      };
    }).sort((a, b) => b.count - a.count);

    return {
      timeRange: range,
      kpis: {
        appointmentsCount,
        completedConsultations,
        waitingPatients,
        avgWaitingTimeMinutes,
        noShowRate,
        noShowCount,
        activeConsultations,
        availableDoctors,
        totalDoctors,
        queueUtilization,
      },
      appointmentsByDepartment,
      appointmentsOverTime: timeSeriesMetrics,
      waitingTimeTrend: timeSeriesMetrics,
      completedConsultationsTrend: timeSeriesMetrics,
      noShowTrend: timeSeriesMetrics,
      doctorWorkload,
      serviceUtilization,
    };
  },

  // --------------------------------------------------------------------------
  // NAVIGATION LOCATIONS (CRUD)
  // --------------------------------------------------------------------------
  async getNavigationLocations(hospitalId: string): Promise<NavigationLocationRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('navigation_locations')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('block');
      if (!error && data) return data;
    }
    return localStore.navigationLocations.filter((n) => n.hospital_id === hospitalId);
  },

  async createNavigationLocation(
    loc: Omit<NavigationLocationRow, 'id'>, 
    actorId?: string
  ): Promise<NavigationLocationRow> {
    const locPayload = {
      ...loc,
      status: loc.status || 'ACTIVE',
      name: loc.name || loc.room,
      department_id: loc.department_id || null,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('navigation_locations')
        .insert(locPayload)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: loc.hospital_id,
        action: 'NAVIGATION_NODE_CREATE',
        resource: 'navigation_locations',
        metadata: { room: loc.room, category: loc.category },
      });
      realtimeManager.broadcastLocalChange('navigation_locations', data as unknown as Record<string, unknown>);
      return data;
    }

    const newLoc: NavigationLocationRow = {
      ...locPayload,
      id: `loc-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStore.navigationLocations.push(newLoc);

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: loc.hospital_id,
      action: 'NAVIGATION_NODE_CREATE',
      resource: 'navigation_locations',
      metadata: { room: loc.room, category: loc.category },
    });

    realtimeManager.broadcastLocalChange('navigation_locations', newLoc as unknown as Record<string, unknown>);
    return newLoc;
  },

  async updateNavigationLocation(
    locId: string, 
    updates: Partial<NavigationLocationRow>, 
    actorId?: string
  ): Promise<NavigationLocationRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('navigation_locations')
        .update(updates)
        .eq('id', locId)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.hospital_id,
        action: 'NAVIGATION_NODE_UPDATE',
        resource: 'navigation_locations',
        metadata: { locId, updates },
      });
      realtimeManager.broadcastLocalChange('navigation_locations', data as unknown as Record<string, unknown>);
      return data;
    }

    const idx = localStore.navigationLocations.findIndex((n) => n.id === locId);
    if (idx !== -1) {
      localStore.navigationLocations[idx] = { 
        ...localStore.navigationLocations[idx], 
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: localStore.navigationLocations[idx].hospital_id,
        action: 'NAVIGATION_NODE_UPDATE',
        resource: 'navigation_locations',
        metadata: { locId, updates },
      });
      realtimeManager.broadcastLocalChange('navigation_locations', localStore.navigationLocations[idx] as unknown as Record<string, unknown>);
      return localStore.navigationLocations[idx];
    }
    throw new Error('Location not found');
  },

  async toggleNavigationLocationStatus(
    locId: string,
    status: 'ACTIVE' | 'INACTIVE',
    actorId?: string
  ): Promise<NavigationLocationRow> {
    return this.updateNavigationLocation(locId, { status }, actorId);
  },

  async deleteNavigationLocation(locId: string, actorId?: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('navigation_locations').delete().eq('id', locId);
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: '11111111-1111-1111-1111-111111111111',
        action: 'NAVIGATION_NODE_DELETE',
        resource: 'navigation_locations',
        metadata: { locId },
      });
      realtimeManager.broadcastLocalChange('navigation_locations', { id: locId, deleted: true });
      return;
    }

    localStore.navigationLocations = localStore.navigationLocations.filter((n) => n.id !== locId);
    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: '11111111-1111-1111-1111-111111111111',
      action: 'NAVIGATION_NODE_DELETE',
      resource: 'navigation_locations',
      metadata: { locId },
    });
    realtimeManager.broadcastLocalChange('navigation_locations', { id: locId, deleted: true });
  },

  // --------------------------------------------------------------------------
  // JOURNEY TEMPLATES & CONFIGURATION
  // --------------------------------------------------------------------------
  async getJourneyTemplates(hospitalId: string): Promise<JourneyTemplateRow[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('journey_templates')
        .select('*, steps:journey_template_steps(*)')
        .eq('hospital_id', hospitalId)
        .order('created_at');
      if (!error && data) return data as any;
    }

    return localStore.journeyTemplates
      .filter((t) => t.hospital_id === hospitalId)
      .map((t) => ({
        ...t,
        steps: localStore.journeyTemplateSteps
          .filter((s) => s.template_id === t.id)
          .sort((a, b) => a.step_order - b.step_order),
      }));
  },

  async createJourneyTemplate(
    tpl: { hospital_id: string; department_id?: string; name: string; description?: string; status?: 'ACTIVE' | 'INACTIVE'; steps: Array<{ name: string; location: string; expected_duration: number; navigation_id?: string }> },
    actorId?: string
  ): Promise<JourneyTemplateRow> {
    const templateId = isSupabaseConfigured ? crypto.randomUUID() : `tpl-${Date.now()}`;
    const newTpl: JourneyTemplateRow = {
      id: templateId,
      hospital_id: tpl.hospital_id,
      department_id: tpl.department_id || null,
      name: tpl.name,
      description: tpl.description || null,
      status: tpl.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      steps: [],
    };

    if (isSupabaseConfigured) {
      const { error: tplErr } = await supabase.from('journey_templates').insert({
        id: newTpl.id,
        hospital_id: newTpl.hospital_id,
        department_id: newTpl.department_id,
        name: newTpl.name,
        description: newTpl.description,
        status: newTpl.status,
      });
      if (tplErr) throw tplErr;

      const stepsPayload = tpl.steps.map((st, i) => ({
        template_id: templateId,
        name: st.name,
        location: st.location,
        navigation_id: st.navigation_id || null,
        step_order: i + 1,
        expected_duration: st.expected_duration || 15,
      }));
      await supabase.from('journey_template_steps').insert(stepsPayload);
    } else {
      localStore.journeyTemplates.push(newTpl);
      tpl.steps.forEach((st, i) => {
        localStore.journeyTemplateSteps.push({
          id: `ts-${Date.now()}-${i}`,
          template_id: templateId,
          name: st.name,
          location: st.location,
          navigation_id: st.navigation_id || null,
          step_order: i + 1,
          expected_duration: st.expected_duration || 15,
          created_at: new Date().toISOString(),
        });
      });
    }

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: tpl.hospital_id,
      action: 'JOURNEY_TEMPLATE_CREATE',
      resource: 'journey_templates',
      metadata: { templateName: tpl.name, stepCount: tpl.steps.length },
    });

    realtimeManager.broadcastLocalChange('journey_templates', newTpl as unknown as Record<string, unknown>);
    return newTpl;
  },

  async updateJourneyTemplate(
    templateId: string,
    updates: Partial<JourneyTemplateRow>,
    actorId?: string
  ): Promise<JourneyTemplateRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('journey_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();
      if (error) throw error;
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: data.hospital_id,
        action: 'JOURNEY_TEMPLATE_UPDATE',
        resource: 'journey_templates',
        metadata: { templateId, updates },
      });
      realtimeManager.broadcastLocalChange('journey_templates', data as unknown as Record<string, unknown>);
      return data;
    }

    const idx = localStore.journeyTemplates.findIndex((t) => t.id === templateId);
    if (idx !== -1) {
      localStore.journeyTemplates[idx] = {
        ...localStore.journeyTemplates[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await this.recordAuditLog({
        actorId,
        role: 'HOSPITAL_ADMIN',
        hospitalId: localStore.journeyTemplates[idx].hospital_id,
        action: 'JOURNEY_TEMPLATE_UPDATE',
        resource: 'journey_templates',
        metadata: { templateId, updates },
      });
      realtimeManager.broadcastLocalChange('journey_templates', localStore.journeyTemplates[idx] as unknown as Record<string, unknown>);
      return localStore.journeyTemplates[idx];
    }
    throw new Error('Journey template not found');
  },

  async toggleJourneyTemplateStatus(
    templateId: string,
    status: 'ACTIVE' | 'INACTIVE',
    actorId?: string
  ): Promise<JourneyTemplateRow> {
    return this.updateJourneyTemplate(templateId, { status }, actorId);
  },

  async updateJourneyTemplateSteps(
    templateId: string, 
    steps: Array<{ name: string; location: string; expected_duration: number; step_order: number; navigation_id?: string | null }>,
    actorId?: string
  ): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('journey_template_steps').delete().eq('template_id', templateId);
      const insertData = steps.map((s, idx) => ({
        template_id: templateId,
        name: s.name,
        location: s.location,
        navigation_id: s.navigation_id || null,
        step_order: idx + 1,
        expected_duration: s.expected_duration || 15,
      }));
      await supabase.from('journey_template_steps').insert(insertData);
    } else {
      localStore.journeyTemplateSteps = localStore.journeyTemplateSteps.filter(
        (s) => s.template_id !== templateId
      );
      steps.forEach((s, idx) => {
        localStore.journeyTemplateSteps.push({
          id: `ts-${Date.now()}-${idx}`,
          template_id: templateId,
          name: s.name,
          location: s.location,
          navigation_id: s.navigation_id || null,
          step_order: idx + 1,
          expected_duration: s.expected_duration || 15,
          created_at: new Date().toISOString(),
        });
      });
    }

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: '11111111-1111-1111-1111-111111111111',
      action: 'JOURNEY_STEPS_REORDER',
      resource: 'journey_templates',
      metadata: { templateId, newStepCount: steps.length },
    });

    realtimeManager.broadcastLocalChange('journey_templates', { id: templateId, stepsUpdated: true });
  },

  async deleteJourneyTemplate(templateId: string, actorId?: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('journey_templates').delete().eq('id', templateId);
    }
    localStore.journeyTemplates = localStore.journeyTemplates.filter((t) => t.id !== templateId);
    localStore.journeyTemplateSteps = localStore.journeyTemplateSteps.filter(
      (s) => s.template_id !== templateId
    );

    await this.recordAuditLog({
      actorId,
      role: 'HOSPITAL_ADMIN',
      hospitalId: '11111111-1111-1111-1111-111111111111',
      action: 'JOURNEY_TEMPLATE_DELETE',
      resource: 'journey_templates',
      metadata: { templateId },
    });

    realtimeManager.broadcastLocalChange('journey_templates', { id: templateId, deleted: true });
  },

  // --------------------------------------------------------------------------
  // JOURNEYS & STEPS (ACTIVE APPOINTMENTS)
  // --------------------------------------------------------------------------
  async getJourneyByAppointment(appointmentId: string): Promise<(JourneyRow & { steps: JourneyStepRow[] }) | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('journeys')
        .select('*, steps:journey_steps(*)')
        .eq('appointment_id', appointmentId)
        .single();
      if (!error && data) {
        data.steps = (data.steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
        return data as any;
      }
    }
    const journey = localStore.journeys.find((j) => j.appointment_id === appointmentId);
    if (!journey) return null;
    const steps = localStore.journeySteps
      .filter((s) => s.journey_id === journey.id)
      .sort((a, b) => a.step_order - b.step_order);
    return { ...journey, steps };
  },

  async updateJourneyStep(stepId: string, status: any): Promise<JourneyStepRow> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('journey_steps')
        .update({ status })
        .eq('id', stepId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const idx = localStore.journeySteps.findIndex((s) => s.id === stepId);
    if (idx !== -1) {
      localStore.journeySteps[idx].status = status;
      realtimeManager.broadcastLocalChange('journeys', localStore.journeySteps[idx] as unknown as Record<string, unknown>);
      return localStore.journeySteps[idx];
    }
    throw new Error('Step not found');
  },

  async advanceJourneyStep(
    appointmentId: string,
    stepId: string,
    targetStatus: JourneyStepStatus = 'COMPLETED',
    actorId?: string,
    actorRole: string = 'HOSPITAL_STAFF'
  ): Promise<{ journey: JourneyRow; steps: JourneyStepRow[]; updatedStep: JourneyStepRow }> {
    const journeyData = await this.getJourneyByAppointment(appointmentId);
    if (!journeyData) throw new Error('Care journey not found for this appointment');

    const steps = [...journeyData.steps].sort((a, b) => a.step_order - b.step_order);
    const stepIdx = steps.findIndex((s) => s.id === stepId);
    if (stepIdx === -1) throw new Error('Journey step not found');

    // 1. Update target step
    const updatedStep = await this.updateJourneyStep(stepId, targetStatus);
    steps[stepIdx] = updatedStep;

    // 2. Advance to next pending step if completed or skipped
    let nextStepOrder = journeyData.current_step;
    if (targetStatus === 'COMPLETED' || targetStatus === 'SKIPPED') {
      const nextPending = steps.find(
        (s) => s.step_order > steps[stepIdx].step_order && s.status !== 'COMPLETED' && s.status !== 'SKIPPED'
      );
      if (nextPending) {
        nextStepOrder = nextPending.step_order;
        if (nextPending.status === 'PENDING') {
          await this.updateJourneyStep(nextPending.id, 'IN_PROGRESS');
          nextPending.status = 'IN_PROGRESS';
        }
      }
    } else if (targetStatus === 'IN_PROGRESS') {
      nextStepOrder = steps[stepIdx].step_order;
    }

    // 3. Check if all steps completed
    const allFinished = steps.every((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED');
    const newJourneyStatus: JourneyStatus = allFinished ? 'COMPLETED' : 'ACTIVE';

    // 4. Update journey row
    let updatedJourney: JourneyRow;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('journeys')
        .update({
          current_step: nextStepOrder,
          status: newJourneyStatus,
        })
        .eq('id', journeyData.id)
        .select()
        .single();
      if (error) throw error;
      updatedJourney = data;
    } else {
      const jIdx = localStore.journeys.findIndex((j) => j.id === journeyData.id);
      localStore.journeys[jIdx].current_step = nextStepOrder;
      localStore.journeys[jIdx].status = newJourneyStatus;
      updatedJourney = localStore.journeys[jIdx];
    }

    // 5. Audit Log
    const apt = await this.getAppointmentById(appointmentId);
    await this.recordAuditLog({
      actorId,
      role: actorRole,
      hospitalId: apt?.hospital_id || '11111111-1111-1111-1111-111111111111',
      action: 'JOURNEY_STEP_ADVANCE',
      resource: 'journeys',
      metadata: {
        appointmentId,
        stepId,
        stepName: updatedStep.name,
        targetStatus,
        newStepOrder: nextStepOrder,
        journeyStatus: newJourneyStatus,
      },
    });

    // 6. Broadcast Realtime
    realtimeManager.broadcastLocalChange('journeys', {
      ...updatedJourney,
      steps,
      appointment_id: appointmentId,
    } as unknown as Record<string, unknown>);
    realtimeManager.broadcastLocalChange('appointments', { id: appointmentId });

    return {
      journey: updatedJourney,
      steps,
      updatedStep,
    };
  },

  // --------------------------------------------------------------------------
  // NOTIFICATIONS (RLS-AWARE & REALTIME-SYNCED)
  // --------------------------------------------------------------------------
  async getNotifications(userId: string, hospitalId?: string): Promise<NotificationRow[]> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }

    return localStore.notifications
      .filter((n) => {
        const matchesUser = n.user_id === userId || n.user_id === null;
        const matchesHospital = !hospitalId || !n.hospital_id || n.hospital_id === hospitalId;
        return matchesUser && matchesHospital;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markNotificationRead(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }
    const notif = localStore.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;

    realtimeManager.broadcastLocalChange('notifications', { id, read: true }, 'UPDATE');
  },

  async markAllNotificationsRead(userId: string, hospitalId?: string): Promise<void> {
    if (isSupabaseConfigured) {
      let query = supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('read', false);
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }
      await query;
    }

    localStore.notifications.forEach((n) => {
      const matchesUser = n.user_id === userId || n.user_id === null;
      const matchesHospital = !hospitalId || !n.hospital_id || n.hospital_id === hospitalId;
      if (matchesUser && matchesHospital) {
        n.read = true;
      }
    });

    realtimeManager.broadcastLocalChange('notifications', { allRead: true, userId, hospitalId }, 'UPDATE');
  },

  async createNotification(
    payload: Omit<NotificationRow, 'id' | 'created_at'>
  ): Promise<NotificationRow> {
    const newNotif: NotificationRow = {
      ...payload,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotif)
        .select()
        .single();
      if (!error && data) {
        realtimeManager.broadcastLocalChange('notifications', data as unknown as Record<string, unknown>, 'INSERT');
        return data;
      }
    }

    localStore.notifications.unshift(newNotif);
    realtimeManager.broadcastLocalChange('notifications', newNotif as unknown as Record<string, unknown>, 'INSERT');
    return newNotif;
  },

  // --------------------------------------------------------------------------
  // DOCTOR DASHBOARD & CLINICAL OPERATIONS
  // --------------------------------------------------------------------------
  async getDoctorByUserId(userId: string): Promise<DoctorRow | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, profile:profiles(*), department:departments(*)')
        .eq('user_id', userId)
        .single();
      if (!error && data) return data as any;
    }
    const doc = localStore.doctors.find((d) => d.user_id === userId);
    if (doc) {
      return {
        ...doc,
        profile: localStore.profiles.find((p) => p.id === doc.user_id),
        department: localStore.departments.find((d) => d.id === doc.department_id),
      };
    }
    // Fallback: If demo user has DOCTOR role but no direct user_id match, return first doctor in hospital
    const defaultDoc = localStore.doctors[0];
    if (defaultDoc) {
      return {
        ...defaultDoc,
        profile: localStore.profiles.find((p) => p.id === defaultDoc.user_id),
        department: localStore.departments.find((d) => d.id === defaultDoc.department_id),
      };
    }
    return null;
  },

  async getDoctorAppointments(
    hospitalId: string,
    doctorId: string,
    date?: string
  ): Promise<(AppointmentRow & { queue_entry?: QueueEntryRow | null })[]> {
    const today = date || new Date().toISOString().split('T')[0];
    let appts: AppointmentRow[] = [];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, department:departments(*), service:services(*), doctor:doctors(*, profile:profiles(*))')
        .eq('hospital_id', hospitalId)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .order('expected_start', { ascending: true });
      if (!error && data) {
        appts = data as any;
      }
    } else {
      appts = localStore.appointments.filter(
        (a) => a.hospital_id === hospitalId && a.doctor_id === doctorId
      );
      // Map relations
      appts = appts.map((a) => ({
        ...a,
        department: localStore.departments.find((d) => d.id === a.department_id),
        service: localStore.services.find((s) => s.id === a.service_id),
        doctor: localStore.doctors.find((d) => d.id === a.doctor_id),
      }));
    }

    // Attach queue entry if any
    const enriched = await Promise.all(
      appts.map(async (appt) => {
        let qEntry: QueueEntryRow | null = null;
        if (isSupabaseConfigured) {
          const { data } = await supabase
            .from('queue_entries')
            .select('*')
            .eq('appointment_id', appt.id)
            .single();
          qEntry = data || null;
        } else {
          qEntry = localStore.queueEntries.find((q) => q.appointment_id === appt.id) || null;
        }
        return {
          ...appt,
          queue_entry: qEntry,
        };
      })
    );

    // Sort by expected_start ascending
    return enriched.sort((a, b) => (a.expected_start || '').localeCompare(b.expected_start || ''));
  },

  async getDoctorQueueEntries(hospitalId: string, doctorId: string): Promise<EnrichedQueueEntry[]> {
    const allQueue = await this.getQueueEntries(hospitalId);
    return allQueue
      .filter((q) => q.appointment?.doctor_id === doctorId)
      .sort((a, b) => a.position - b.position);
  },

  async getDoctorCurrentPatient(
    hospitalId: string,
    doctorId: string
  ): Promise<{
    queue_id: string;
    queue_reference: string;
    appointment_id: string;
    appointment_reference: string;
    service_name: string;
    status: QueueStatus;
    called_at: string | null;
    started_at: string | null;
    estimated_wait: number;
    department_name: string;
    room_location: string;
  } | null> {
    const doctorQueue = await this.getDoctorQueueEntries(hospitalId, doctorId);
    // Find active patient: IN_PROGRESS first, then CALLED
    const active =
      doctorQueue.find((q) => q.status === 'IN_PROGRESS') ||
      doctorQueue.find((q) => q.status === 'CALLED');

    if (!active) return null;

    return {
      queue_id: active.id,
      queue_reference: active.queue_reference,
      appointment_id: active.appointment_id,
      appointment_reference: active.appointment?.id
        ? active.appointment.id.toUpperCase()
        : `APT-${active.appointment_id.replace('apt-', '')}`,
      service_name: active.appointment?.service?.name || 'General Consultation',
      status: active.status,
      called_at: active.called_at,
      started_at: active.started_at,
      estimated_wait: active.estimated_wait,
      department_name: active.appointment?.department?.name || 'OPD',
      room_location: active.appointment?.department?.location || 'Consultation Room',
    };
  },

  async getDoctorNextPatient(hospitalId: string, doctorId: string): Promise<EnrichedQueueEntry | null> {
    const doctorQueue = await this.getDoctorQueueEntries(hospitalId, doctorId);
    // Return earliest WAITING patient in queue
    const waiting = doctorQueue
      .filter((q) => q.status === 'WAITING')
      .sort((a, b) => a.position - b.position);

    return waiting.length > 0 ? waiting[0] : null;
  },

  async updateDoctorSelfAvailability(
    doctorId: string,
    status: DoctorStatus,
    actorId?: string
  ): Promise<{
    doctor: DoctorRow;
    affectedAppointmentsCount: number;
    affectedAppointments: AppointmentRow[];
    warningMessage: string | null;
  }> {
    // 1. Fetch current doctor
    let doctor: DoctorRow | null = null;
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('doctors')
        .select('*, profile:profiles(*), department:departments(*)')
        .eq('id', doctorId)
        .single();
      doctor = data as any;
    } else {
      doctor = localStore.doctors.find((d) => d.id === doctorId) || null;
    }

    if (!doctor) throw new Error('Doctor profile not found');

    // 2. Security Check: actor must be this doctor or admin
    if (actorId && doctor.user_id !== actorId) {
      const actorProfile = isSupabaseConfigured
        ? await this.getProfileById(actorId)
        : localStore.profiles.find((p) => p.id === actorId);

      if (actorProfile?.role !== 'HOSPITAL_ADMIN') {
        throw new Error('Unauthorized: Doctors can only modify their own availability status');
      }
    }

    // 3. Update status
    const updatedDoctor = await this.updateDoctorStatus(doctorId, status, actorId);

    // 4. Compute affected appointments warning if doctor becomes unavailable
    let affectedCount = 0;
    let affected: AppointmentRow[] = [];
    let warningMessage: string | null = null;

    if (status === 'UNAVAILABLE' || status === 'ON_BREAK' || status === 'ON_LEAVE' || status === 'OFFLINE') {
      const todayAppointments = await this.getDoctorAppointments(doctor.hospital_id, doctorId);
      affected = todayAppointments.filter((a) =>
        ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)
      );
      affectedCount = affected.length;

      if (affectedCount > 0) {
        warningMessage = `Notice: You have ${affectedCount} appointment${
          affectedCount > 1 ? 's' : ''
        } scheduled today. Clinical coordination and triage will be notified to manage patient flow.`;
      }
    }

    // 5. Trigger Realtime notification & broadcast
    realtimeManager.broadcastLocalChange('doctors', updatedDoctor as unknown as Record<string, unknown>);

    return {
      doctor: updatedDoctor,
      affectedAppointmentsCount: affectedCount,
      affectedAppointments: affected,
      warningMessage,
    };
  },

  async executeDoctorConsultationAction(
    queueId: string,
    action: 'CALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW',
    doctorId: string,
    actorId?: string
  ): Promise<QueueEntryRow> {
    // 1. Fetch current authoritative server state
    let currentEntry: QueueEntryRow | null = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*, appointment:appointments(*)')
        .eq('id', queueId)
        .single();
      if (error || !data) throw new Error('Queue entry not found on server');
      currentEntry = data;
    } else {
      currentEntry = localStore.queueEntries.find((q) => q.id === queueId) || null;
    }

    if (!currentEntry) throw new Error('Queue entry not found');

    const currentStatus = currentEntry.status;

    // 2. Validate current state matches requested action
    let targetStatus: QueueStatus;

    if (action === 'CALL') {
      if (!['WAITING', 'SKIPPED', 'NO_SHOW'].includes(currentStatus)) {
        throw new Error('This queue has changed. The latest information has been loaded.');
      }
      targetStatus = 'CALLED';
    } else if (action === 'START') {
      if (currentStatus !== 'CALLED') {
        throw new Error('This queue has changed. The latest information has been loaded.');
      }
      targetStatus = 'IN_PROGRESS';
    } else if (action === 'COMPLETE') {
      if (currentStatus !== 'IN_PROGRESS') {
        throw new Error('This queue has changed. The latest information has been loaded.');
      }
      targetStatus = 'COMPLETED';
    } else if (action === 'SKIP') {
      if (!['WAITING', 'CALLED'].includes(currentStatus)) {
        throw new Error('This queue has changed. The latest information has been loaded.');
      }
      targetStatus = 'SKIPPED';
    } else if (action === 'NO_SHOW') {
      if (!['WAITING', 'CALLED'].includes(currentStatus)) {
        throw new Error('This queue has changed. The latest information has been loaded.');
      }
      targetStatus = 'NO_SHOW';
    } else {
      throw new Error(`Unsupported consultation action: ${action}`);
    }

    // 3. Perform the state update
    return this.updateQueueStatus(queueId, targetStatus, actorId, 'DOCTOR');
  },

  // --------------------------------------------------------------------------
  // DOCTOR UNAVAILABLE DISRUPTION WORKFLOW & BACKEND VALIDATION
  // --------------------------------------------------------------------------
  async getDoctorUnavailableDisruptions(hospitalId: string): Promise<DoctorDisruptionIncident[]> {
    const doctors = await this.getDoctors(hospitalId);
    // Find doctors who are currently unavailable, on break, on leave, or offline
    const unavailableDoctors = doctors.filter((d) =>
      ['UNAVAILABLE', 'ON_BREAK', 'ON_LEAVE', 'OFFLINE'].includes(d.status)
    );

    const incidents: DoctorDisruptionIncident[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const doc of unavailableDoctors) {
      // Find active appointments assigned to this doctor for today or upcoming
      let appts: AppointmentRow[] = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('appointments')
          .select('*, department:departments(*), service:services(*), doctor:doctors(*, profile:profiles(*))')
          .eq('hospital_id', hospitalId)
          .eq('doctor_id', doc.id)
          .in('status', ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'])
          .gte('appointment_date', today);
        if (data) appts = data as any;
      } else {
        appts = localStore.appointments
          .filter(
            (a) =>
              a.hospital_id === hospitalId &&
              a.doctor_id === doc.id &&
              ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status) &&
              a.appointment_date >= today
          )
          .map((a) => ({
            ...a,
            department: localStore.departments.find((d) => d.id === a.department_id),
            service: localStore.services.find((s) => s.id === a.service_id),
            doctor: doc,
          }));
      }

      if (appts.length > 0) {
        // Find department
        const dept = doc.department || localStore.departments.find((d) => d.id === doc.department_id) || {
          id: doc.department_id,
          name: 'Clinical OPD',
          description: 'Clinical Outpatient Department',
          location: 'Main Wing',
          hospital_id: hospitalId,
          floor: '2',
          status: 'ACTIVE' as const,
        };

        // Determine unavailable period description
        let unavailablePeriod = 'Current Clinical Shift (Today)';
        if (doc.status === 'ON_BREAK') unavailablePeriod = 'Scheduled Duty Break (12:30 - 13:30)';
        else if (doc.status === 'ON_LEAVE') unavailablePeriod = 'Approved Leave of Absence';
        else if (doc.status === 'UNAVAILABLE') unavailablePeriod = 'Emergency / Off-Duty Window';

        // Precompute backend alternatives for each appointment
        const enrichedAffected: AffectedAppointmentItem[] = await Promise.all(
          appts.map(async (a) => {
            const queueEntry = isSupabaseConfigured
              ? (await supabase.from('queue_entries').select('*').eq('appointment_id', a.id).single()).data
              : localStore.queueEntries.find((q) => q.appointment_id === a.id) || null;

            const alternatives = await this.getBackendRescheduleAlternatives(a.id);

            return {
              ...a,
              queue_entry: queueEntry,
              alternatives,
              isResolved: false,
            };
          })
        );

        incidents.push({
          incidentId: `disruption-${doc.id}-${today}`,
          doctor: doc,
          unavailablePeriod,
          status: doc.status,
          department: dept,
          totalAffected: enrichedAffected.length,
          pendingCount: enrichedAffected.length,
          resolvedCount: 0,
          affectedAppointments: enrichedAffected,
        });
      }
    }

    return incidents;
  },

  async getBackendRescheduleAlternatives(appointmentId: string): Promise<BackendRescheduleAlternatives> {
    // 1. Fetch appointment
    let appt: AppointmentRow | null = null;
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('appointments')
        .select('*, department:departments(*), service:services(*), doctor:doctors(*, profile:profiles(*))')
        .eq('id', appointmentId)
        .single();
      appt = data as any;
    } else {
      appt = localStore.appointments.find((a) => a.id === appointmentId) || null;
      if (appt) {
        appt = {
          ...appt,
          department: localStore.departments.find((d) => d.id === appt!.department_id),
          service: localStore.services.find((s) => s.id === appt!.service_id),
          doctor: localStore.doctors.find((d) => d.id === appt!.doctor_id),
        };
      }
    }

    if (!appt) throw new Error('Appointment not found');

    const hospitalId = appt.hospital_id;
    const departmentId = appt.department_id;
    const allDoctors = await this.getDoctors(hospitalId);

    // 2. Candidate doctors in same department who are NOT the unavailable doctor and are AVAILABLE
    const deptDoctors = allDoctors.filter(
      (d) =>
        d.department_id === departmentId &&
        d.id !== appt!.doctor_id &&
        d.status === 'AVAILABLE'
    );

    // If no AVAILABLE doctors in dept, fallback to any active doctor in the department
    const fallbackDeptDoctors = deptDoctors.length > 0 
      ? deptDoctors 
      : allDoctors.filter((d) => d.department_id === departmentId && d.id !== appt!.doctor_id && d.status !== 'OFFLINE');

    // 3. Operating hours
    const dept = appt.department || localStore.departments.find((d) => d.id === departmentId);
    const openHour = dept?.operating_hours?.open || '08:30';
    const closeHour = dept?.operating_hours?.close || '17:00';

    // 4. Generate candidate time slots for today
    const candidateSlots = ['09:30', '10:15', '11:00', '11:45', '14:00', '14:45', '15:30', '16:15'];
    const validSlots = candidateSlots.filter((slot) => slot >= openHour && slot <= closeHour);

    // 5. Query existing appointments today to avoid schedule conflicts
    const today = appt.appointment_date || new Date().toISOString().split('T')[0];
    const existingToday = isSupabaseConfigured
      ? (await supabase.from('appointments').select('*').eq('hospital_id', hospitalId).eq('appointment_date', today)).data || []
      : localStore.appointments.filter((a) => a.hospital_id === hospitalId && a.appointment_date === today);

    // Map alternative doctors and their conflict-free slots
    const alternativeDoctors = fallbackDeptDoctors.map((doc) => {
      const bookedTimes = existingToday
        .filter((a) => a.doctor_id === doc.id && a.status !== 'CANCELLED')
        .map((a) => (a.expected_start?.includes('T') ? a.expected_start.split('T')[1].substring(0, 5) : a.expected_start));

      const freeSlots = validSlots.filter((slot) => !bookedTimes.includes(slot));
      return {
        doctor: doc,
        availableSlots: freeSlots.length > 0 ? freeSlots : ['10:00', '14:30'],
      };
    });

    // 6. Recommended Doctor: first doctor with free slots
    const recommended = alternativeDoctors.find((ad) => ad.availableSlots.length > 0);
    const recommendedDoctor = recommended ? recommended.doctor : (fallbackDeptDoctors[0] || null);
    const recommendedTime = recommended && recommended.availableSlots[0] ? recommended.availableSlots[0] : '10:30';

    // 7. Alternative Dates (Tomorrow and next business day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const alternativeDates = [
      { date: tomorrowStr, availableDoctors: fallbackDeptDoctors },
      { date: dayAfterStr, availableDoctors: fallbackDeptDoctors },
    ];

    return {
      appointmentId,
      recommendedDoctor,
      recommendedDate: today,
      recommendedTime,
      alternativeDoctors,
      alternativeDates,
      operatingHours: { open: openHour, close: closeHour },
      reasonSummary: `Assigned physician Dr. ${appt.doctor?.profile?.name || 'Physician'} is currently unavailable. Backend recommends Dr. ${recommendedDoctor?.profile?.name || 'an available specialist'} at ${recommendedTime}.`,
    };
  },

  async reassignOrRescheduleAppointment(
    payload: RescheduleActionPayload,
    actorId?: string,
    actorRole: string = 'HOSPITAL_STAFF'
  ): Promise<RescheduleResult> {
    const { appointmentId, actionType, targetDoctorId, targetDate, targetTime, cancellationReason } = payload;

    // 1. Permission check
    const allowedRoles = ['HOSPITAL_ADMIN', 'HOSPITAL_STAFF'];
    if (!allowedRoles.includes(actorRole)) {
      throw new Error('Unauthorized: Only authorized hospital administrative staff can reschedule patient appointments.');
    }

    // 2. Fetch current appointment
    let appt: AppointmentRow | null = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, department:departments(*), service:services(*), doctor:doctors(*, profile:profiles(*))')
        .eq('id', appointmentId)
        .single();
      if (error || !data) throw new Error('Appointment not found on server');
      appt = data as any;
    } else {
      appt = localStore.appointments.find((a) => a.id === appointmentId) || null;
    }

    if (!appt) throw new Error('Appointment not found');

    if (appt.status === 'COMPLETED' || appt.status === 'CANCELLED') {
      throw new Error(`Cannot reschedule an appointment that is already ${appt.status.toLowerCase()}.`);
    }

    // 3. CANCEL Action
    if (actionType === 'CANCEL') {
      const cancelReason = cancellationReason || 'Doctor unavailable and patient requested cancellation.';
      const updated = await this.updateAppointment(
        appointmentId,
        { status: 'CANCELLED', notes: `Cancelled: ${cancelReason}` },
        actorId
      );

      // Cancel associated queue entry if any
      const queueEntry = localStore.queueEntries.find((q) => q.appointment_id === appointmentId);
      if (queueEntry && queueEntry.status !== 'COMPLETED') {
        await this.updateQueueStatus(queueEntry.id, 'CANCELLED', actorId, actorRole);
      }

      await this.recordAuditLog({
        actorId,
        role: actorRole,
        hospitalId: appt.hospital_id,
        action: 'APPOINTMENT_CANCELLED',
        resource: 'appointments',
        metadata: { appointmentId, reason: cancelReason },
      });

      realtimeManager.broadcastLocalChange('appointments', updated as unknown as Record<string, unknown>);

      return {
        success: true,
        appointment: updated,
        message: 'Appointment was cancelled successfully due to doctor unavailability.',
      };
    }

    // 4. RESCHEDULING / REASSIGNMENT VALIDATION
    // Target Doctor
    const newDoctorId = targetDoctorId || appt.doctor_id;
    if (!newDoctorId) {
      throw new Error('Validation failed: A target doctor must be selected for reassignment.');
    }

    const doctors = await this.getDoctors(appt.hospital_id);
    const targetDoc = doctors.find((d) => d.id === newDoctorId);
    if (!targetDoc) {
      throw new Error('Validation failed: Target doctor not found in this hospital.');
    }

    // Validation: Target doctor availability
    if (targetDoc.status === 'OFFLINE' || targetDoc.status === 'ON_LEAVE') {
      throw new Error(`Validation failed: Dr. ${targetDoc.profile?.name || 'Selected doctor'} is currently ${targetDoc.status.replace('_', ' ')} and cannot accept reassignments.`);
    }

    // Validation: Department compatibility
    if (targetDoc.department_id !== appt.department_id) {
      throw new Error('Validation failed: Selected doctor does not belong to the required clinical department.');
    }

    // Validation: Operating hours
    const dept = targetDoc.department || localStore.departments.find((d) => d.id === targetDoc.department_id);
    const openTime = dept?.operating_hours?.open || '08:00';
    const closeTime = dept?.operating_hours?.close || '20:00';

    const newDate = targetDate || appt.appointment_date;
    const newTime = targetTime || (appt.expected_start?.includes('T') ? appt.expected_start.split('T')[1].substring(0, 5) : '10:30');

    if (newTime < openTime || newTime > closeTime) {
      throw new Error(`Validation failed: Selected time ${newTime} falls outside department operating hours (${openTime} - ${closeTime}).`);
    }

    // Validation: Schedule Conflict Check (prevent double-booking)
    const existingAppointments = isSupabaseConfigured
      ? (await supabase.from('appointments').select('*').eq('hospital_id', appt.hospital_id).eq('doctor_id', newDoctorId).eq('appointment_date', newDate)).data || []
      : localStore.appointments.filter((a) => a.hospital_id === appt!.hospital_id && a.doctor_id === newDoctorId && a.appointment_date === newDate);

    const hasConflict = existingAppointments.some((a) => {
      if (a.id === appointmentId || a.status === 'CANCELLED') return false;
      const startTime = a.expected_start?.includes('T') ? a.expected_start.split('T')[1].substring(0, 5) : a.expected_start;
      return startTime === newTime;
    });

    if (hasConflict) {
      throw new Error(`Schedule conflict: Dr. ${targetDoc.profile?.name || 'Target doctor'} already has a scheduled appointment at ${newTime} on ${newDate}. Please select another time slot.`);
    }

    // 5. Compute new timestamps
    const expectedStart = `${newDate}T${newTime}:00Z`;
    const durationMins = appt.service?.expected_duration || 20;
    const endDateObj = new Date(new Date(expectedStart).getTime() + durationMins * 60000);
    const expectedEnd = endDateObj.toISOString();

    // 6. Apply Mutation to Supabase / LocalStore
    const updatePayload: Partial<AppointmentRow> = {
      doctor_id: newDoctorId,
      appointment_date: newDate,
      expected_start: expectedStart,
      expected_end: expectedEnd,
      status: 'CONFIRMED',
      notes: `Reassigned from Dr. ${appt.doctor?.profile?.name || 'Original Doctor'} to Dr. ${targetDoc.profile?.name} due to schedule disruption.`,
    };

    const updatedAppointment = await this.updateAppointment(appointmentId, updatePayload, actorId);

    // Update queue entry if patient was checked in
    const queueEntry = localStore.queueEntries.find((q) => q.appointment_id === appointmentId);
    if (queueEntry) {
      realtimeManager.broadcastLocalChange('queue_entries', queueEntry as unknown as Record<string, unknown>);
    }

    // 7. Audit Log
    await this.recordAuditLog({
      actorId,
      role: actorRole,
      hospitalId: appt.hospital_id,
      action: 'DOCTOR_UNAVAILABLE_REASSIGNMENT',
      resource: 'appointments',
      metadata: {
        appointmentId,
        originalDoctorId: appt.doctor_id,
        newDoctorId,
        newDate,
        newTime,
        actionType,
      },
    });

    // 8. Create Notification for Clinical Team & Patient Portal Sync
    const notifMsg = `Appointment ${appt.id.toUpperCase()} reassigned to Dr. ${targetDoc.profile?.name} on ${newDate} at ${newTime}.`;
    const notificationId = `notif-${Date.now()}`;
    localStore.notifications.unshift({
      id: notificationId,
      user_id: targetDoc.user_id,
      type: 'APPOINTMENT_RESCHEDULED',
      title: 'Appointment Reassigned',
      message: notifMsg,
      read: false,
      created_at: new Date().toISOString(),
    });

    // 9. Emit Realtime Events across browser windows
    realtimeManager.broadcastLocalChange('appointments', updatedAppointment as unknown as Record<string, unknown>);
    realtimeManager.broadcastLocalChange('notifications', { id: notificationId, title: 'Appointment Reassigned', message: notifMsg });

    return {
      success: true,
      appointment: updatedAppointment,
      message: `Successfully reassigned to Dr. ${targetDoc.profile?.name} for ${newDate} at ${newTime}.`,
    };
  },
};
