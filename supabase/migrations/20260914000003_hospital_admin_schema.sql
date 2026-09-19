-- ============================================================================
-- SMART HOSPITAL QUEUE & NAVIGATION SYSTEM - HOSPITAL ADMIN EXTENSIONS
-- Migration: 20260914000003_hospital_admin_schema.sql
-- ============================================================================

-- 1. UPDATE DOCTOR STATUS CONSTRAINT
-- Allow: AVAILABLE, BUSY, ON_BREAK, UNAVAILABLE, ON_LEAVE, OFFLINE
ALTER TABLE public.doctors 
    DROP CONSTRAINT IF EXISTS doctors_status_check;

ALTER TABLE public.doctors
    ADD CONSTRAINT doctors_status_check CHECK (
        status IN ('AVAILABLE', 'BUSY', 'ON_BREAK', 'UNAVAILABLE', 'ON_LEAVE', 'OFFLINE')
    );

-- 2. EXTEND NAVIGATION LOCATIONS WITH CATEGORY
-- Support: CONSULTATION, RADIOLOGY, LABORATORY, PHARMACY, REGISTRATION, OTHER
ALTER TABLE public.navigation_locations
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'CONSULTATION'
    CHECK (category IN ('CONSULTATION', 'RADIOLOGY', 'LABORATORY', 'PHARMACY', 'REGISTRATION', 'OTHER'));

-- 3. PATIENT JOURNEY TEMPLATES (CONFIGURABLE WORKFLOWS)
CREATE TABLE IF NOT EXISTS public.journey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. JOURNEY TEMPLATE STEPS
CREATE TABLE IF NOT EXISTS public.journey_template_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.journey_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    expected_duration INTEGER NOT NULL DEFAULT 15, -- minutes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_templates_hospital ON public.journey_templates(hospital_id);
CREATE INDEX IF NOT EXISTS idx_journey_template_steps_tpl ON public.journey_template_steps(template_id, step_order);
CREATE INDEX IF NOT EXISTS idx_nav_locations_category ON public.navigation_locations(hospital_id, category);

-- 5. ROW LEVEL SECURITY POLICIES FOR JOURNEY TEMPLATES
ALTER TABLE public.journey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_template_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_journey_templates_same_hospital"
    ON public.journey_templates
    FOR SELECT
    TO authenticated
    USING (hospital_id = public.current_user_hospital_id());

CREATE POLICY "admin_manage_journey_templates"
    ON public.journey_templates
    FOR ALL
    TO authenticated
    USING (
        hospital_id = public.current_user_hospital_id()
        AND public.current_user_role() = 'HOSPITAL_ADMIN'
    );

CREATE POLICY "view_journey_template_steps"
    ON public.journey_template_steps
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.journey_templates jt
            WHERE jt.id = public.journey_template_steps.template_id
            AND jt.hospital_id = public.current_user_hospital_id()
        )
    );

CREATE POLICY "admin_manage_journey_template_steps"
    ON public.journey_template_steps
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.journey_templates jt
            WHERE jt.id = public.journey_template_steps.template_id
            AND jt.hospital_id = public.current_user_hospital_id()
            AND public.current_user_role() = 'HOSPITAL_ADMIN'
        )
    );

-- Enable Realtime for Journey Templates
ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_template_steps;
