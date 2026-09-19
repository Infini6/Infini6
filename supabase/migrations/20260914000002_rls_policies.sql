-- ============================================================================
-- SMART HOSPITAL QUEUE & NAVIGATION SYSTEM - ROW LEVEL SECURITY POLICIES
-- Migration: 20260914000002_rls_policies.sql
-- Compatible with Supabase PostgreSQL & Supabase Realtime
-- ============================================================================

-- 1. HELPER FUNCTIONS FOR SECURITY CONTEXT
-- Retrieve the authenticated user's hospital_id from their profile
CREATE OR REPLACE FUNCTION public.current_user_hospital_id()
RETURNS UUID AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Retrieve the authenticated user's role from their profile
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Retrieve the authenticated user's doctor id if they are a doctor
CREATE OR REPLACE FUNCTION public.current_user_doctor_id()
RETURNS UUID AS $$
  SELECT id FROM public.doctors WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. HOSPITALS POLICIES
-- Authenticated hospital personnel can view only their own hospital
CREATE POLICY "hospital_staff_view_own_hospital"
    ON public.hospitals
    FOR SELECT
    TO authenticated
    USING (id = public.current_user_hospital_id());

-- Only HOSPITAL_ADMIN can update their own hospital details
CREATE POLICY "hospital_admin_update_own_hospital"
    ON public.hospitals
    FOR UPDATE
    TO authenticated
    USING (
        id = public.current_user_hospital_id() 
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 4. PROFILES POLICIES
-- Users can view their own profile, or staff/admin can view profiles within the same hospital
CREATE POLICY "view_profiles_in_same_hospital"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR hospital_id = public.current_user_hospital_id()
    );

-- Users can update their own personal info
CREATE POLICY "users_update_own_profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND hospital_id = public.current_user_hospital_id());

-- Only HOSPITAL_ADMIN can create or update profiles in their hospital
CREATE POLICY "hospital_admin_manage_profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id() 
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 5. DEPARTMENTS POLICIES
-- All staff/doctors in the hospital can view departments
CREATE POLICY "view_departments_same_hospital"
    ON public.departments
    FOR SELECT
    TO authenticated
    USING (hospital_id = public.current_user_hospital_id());

-- Only HOSPITAL_ADMIN can insert, update, or delete departments
CREATE POLICY "hospital_admin_manage_departments"
    ON public.departments
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id() 
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 6. DOCTORS POLICIES
-- Staff and doctors can view doctor listings within their hospital
CREATE POLICY "view_doctors_same_hospital"
    ON public.doctors
    FOR SELECT
    TO authenticated
    USING (hospital_id = public.current_user_hospital_id());

-- Doctors can update their own status (e.g. AVAILABLE, BUSY, ON_BREAK)
CREATE POLICY "doctor_update_own_status"
    ON public.doctors
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        AND hospital_id = public.current_user_hospital_id()
    )
    WITH CHECK (
        user_id = auth.uid()
        AND hospital_id = public.current_user_hospital_id()
    );

-- Admins can manage all doctor records in their hospital
CREATE POLICY "admin_manage_doctors"
    ON public.doctors
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id() 
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 7. DOCTOR SCHEDULES POLICIES
CREATE POLICY "view_doctor_schedules"
    ON public.doctor_schedules
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors d
            WHERE d.id = public.doctor_schedules.doctor_id
            AND d.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "doctor_manage_own_schedule"
    ON public.doctor_schedules
    FOR ALL
    TO authenticated
    USING (
        doctor_id = public.current_user_doctor_id()
        OR public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 8. SERVICES POLICIES
CREATE POLICY "view_services_same_hospital"
    ON public.services
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.departments d
            WHERE d.id = public.services.department_id
            AND d.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "admin_manage_services"
    ON public.services
    FOR ALL
    TO authenticated
    USING (
        public.current_user_role() = 'HOSPITAL_ADMIN'
        AND EXISTS (
            SELECT 1 FROM public.departments d
            WHERE d.id = public.services.department_id
            AND d.hospital_id = public.current_user_hospital_id()
        )
    );

-- 9. APPOINTMENTS POLICIES
-- Hospital staff & admin see all appointments for their hospital.
-- Doctors see appointments assigned to them or unassigned in their department.
CREATE POLICY "view_hospital_appointments"
    ON public.appointments
    FOR SELECT
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id()
        AND (
            public.current_user_role() IN ('HOSPITAL_ADMIN', 'HOSPITAL_STAFF')
            OR (
                public.current_user_role() = 'DOCTOR'
                AND (doctor_id = public.current_user_doctor_id() OR doctor_id IS NULL)
            )
        )
    );

CREATE POLICY "manage_hospital_appointments"
    ON public.appointments
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id()
        AND (
            public.current_user_role() IN ('HOSPITAL_ADMIN', 'HOSPITAL_STAFF')
            OR (
                public.current_user_role() = 'DOCTOR'
                AND doctor_id = public.current_user_doctor_id()
            )
        )
    );

-- 10. QUEUE ENTRIES POLICIES
CREATE POLICY "view_hospital_queue_entries"
    ON public.queue_entries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = public.queue_entries.appointment_id
            AND a.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "manage_hospital_queue_entries"
    ON public.queue_entries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = public.queue_entries.appointment_id
            AND a.hospital_id = public.current_user_hospital_id()
            AND (
                public.current_user_role() IN ('HOSPITAL_ADMIN', 'HOSPITAL_STAFF')
                OR (
                    public.current_user_role() = 'DOCTOR'
                    AND a.doctor_id = public.current_user_doctor_id()
                )
            )
        )
    );

-- 11. JOURNEYS & JOURNEY STEPS POLICIES
CREATE POLICY "view_hospital_journeys"
    ON public.journeys
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = public.journeys.appointment_id
            AND a.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "manage_hospital_journeys"
    ON public.journeys
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = public.journeys.appointment_id
            AND a.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "view_hospital_journey_steps"
    ON public.journey_steps
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.journeys j
            JOIN public.appointments a ON a.id = j.appointment_id
            WHERE j.id = public.journey_steps.journey_id
            AND a.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "manage_hospital_journey_steps"
    ON public.journey_steps
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.journeys j
            JOIN public.appointments a ON a.id = j.appointment_id
            WHERE j.id = public.journey_steps.journey_id
            AND a.hospital_id = public.current_user_hospital_id()
        )
    );

-- 12. NAVIGATION LOCATIONS POLICIES
CREATE POLICY "view_navigation_locations"
    ON public.navigation_locations
    FOR SELECT
    TO authenticated
    USING (hospital_id = public.current_user_hospital_id());

CREATE POLICY "admin_manage_navigation_locations"
    ON public.navigation_locations
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id()
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

-- 13. NOTIFICATIONS POLICIES
CREATE POLICY "user_view_own_notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "user_update_own_notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- 14. AUDIT LOGS POLICIES
CREATE POLICY "view_hospital_audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id()
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

CREATE POLICY "insert_hospital_audit_logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (hospital_id = public.current_user_hospital_id());

-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================
-- Enable Realtime replication for the required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
