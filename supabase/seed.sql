-- ============================================================================
-- SMART HOSPITAL QUEUE & NAVIGATION SYSTEM - SEED / DEMO DATA
-- File: supabase/seed.sql
-- Run this after running migrations to populate development & testing data
-- ============================================================================

-- Clean existing data if needed (optional during dev reset)
-- TRUNCATE public.audit_logs, public.notifications, public.navigation_locations, 
--   public.journey_steps, public.journeys, public.queue_entries, public.appointments, 
--   public.services, public.doctor_schedules, public.doctors, public.departments, 
--   public.profiles, public.hospitals CASCADE;

-- 1. HOSPITALS
INSERT INTO public.hospitals (id, name, address, contact, operating_hours, status)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'City General Metropolitan Hospital',
    '100 Medical Center Way, Health District, Sector 4',
    '+1 (555) 019-2834 / opd@citygeneral.health',
    '{
        "monday": {"open": "08:00", "close": "20:00"},
        "tuesday": {"open": "08:00", "close": "20:00"},
        "wednesday": {"open": "08:00", "close": "20:00"},
        "thursday": {"open": "08:00", "close": "20:00"},
        "friday": {"open": "08:00", "close": "20:00"},
        "saturday": {"open": "08:00", "close": "14:00"},
        "sunday": {"closed": true}
    }'::jsonb,
    'ACTIVE'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Metro Health Memorial Hospital',
    '45 West Parkway Blvd, Riverside District',
    '+1 (555) 048-9122 / support@metrohealth.org',
    '{
        "monday": {"open": "07:30", "close": "21:00"},
        "tuesday": {"open": "07:30", "close": "21:00"},
        "wednesday": {"open": "07:30", "close": "21:00"},
        "thursday": {"open": "07:30", "close": "21:00"},
        "friday": {"open": "07:30", "close": "21:00"},
        "saturday": {"open": "08:00", "close": "16:00"},
        "sunday": {"closed": true}
    }'::jsonb,
    'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. DEPARTMENTS (FOR HOSPITAL 1)
INSERT INTO public.departments (id, hospital_id, name, description, location, floor, status)
VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Obstetrics & Gynecology (OB/GYN)',
    'Comprehensive maternal, antenatal care and women health services',
    'Block B, Wing East',
    'Floor 2',
    'ACTIVE'
),
(
    'd2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Cardiology',
    'Adult cardiovascular consultation, ECG, Echo and cardiac monitoring',
    'Block A, Wing North',
    'Floor 1',
    'ACTIVE'
),
(
    'd3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Neurology',
    'Central nervous system diagnostics, EEG and neuropathy clinic',
    'Block A, Wing South',
    'Floor 3',
    'ACTIVE'
),
(
    'd4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Orthopedics',
    'Bone, joint, musculoskeletal trauma and rehabilitation clinic',
    'Block C, Ground Floor',
    'Floor 0',
    'ACTIVE'
),
(
    'd5555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'General Medicine & Triage',
    'Primary OPD evaluation, preventive checkups and triage sorting',
    'Main Atrium Entrance',
    'Floor 1',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 3. SERVICES (FOR DEPARTMENTS)
INSERT INTO public.services (id, department_id, name, description, expected_duration, requirements, status)
VALUES
(
    's1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'Antenatal Routine Checkup',
    'Maternal BP, weight, fundal height and fetal heartbeat Doppler scan',
    20,
    'Carry previous ultrasound reports and immunization book',
    'ACTIVE'
),
(
    's2222222-2222-2222-2222-222222222222',
    'd1111111-1111-1111-1111-111111111111',
    'Anomaly & Growth Ultrasound Scan',
    'High resolution fetal anatomic survey and Doppler blood flow analysis',
    30,
    'Drink 500ml water 30 mins prior to scan',
    'ACTIVE'
),
(
    's3333333-3333-3333-3333-333333333333',
    'd2222222-2222-2222-2222-222222222222',
    'Standard 12-Lead ECG & Triage',
    'Electrophysiology recording for chest pain or arrhythmia evaluation',
    15,
    'Rest seated for 5 minutes prior to measurement',
    'ACTIVE'
),
(
    's4444444-4444-4444-4444-444444444444',
    'd2222222-2222-2222-2222-222222222222',
    '2D Transthoracic Echocardiogram',
    'Cardiac structural ultrasound and ejection fraction evaluation',
    30,
    'No fasting required',
    'ACTIVE'
),
(
    's5555555-5555-5555-5555-555555555555',
    'd5555555-5555-5555-5555-555555555555',
    'General OPD Consultation',
    'General health complaints, prescription renewals, primary diagnosis',
    15,
    'Valid ID and previous prescriptions',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 4. NAVIGATION LOCATIONS (WAYFINDING DIRECTORY)
INSERT INTO public.navigation_locations (id, hospital_id, building, block, floor, room, counter, coordinates)
VALUES
(
    'n1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Main Hospital Building',
    'Block A',
    'Floor 1',
    'Room 101',
    'Counter C-1 (Registration)',
    '{"x": 120, "y": 85}'::jsonb
),
(
    'n2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Women & Child Health Wing',
    'Block B',
    'Floor 2',
    'Room 204 (OB/GYN Consult)',
    'Counter C-4 (Triage Station)',
    '{"x": 340, "y": 210}'::jsonb
),
(
    'n3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Women & Child Health Wing',
    'Block B',
    'Floor 2',
    'Room 208 (Ultrasound Lab)',
    'Scan Room 2',
    '{"x": 420, "y": 260}'::jsonb
),
(
    'n4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Cardiovascular Center',
    'Block A',
    'Floor 1',
    'Room 112 (Echo Lab)',
    'Station E-1',
    '{"x": 190, "y": 320}'::jsonb
),
(
    'n5555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Main Central Pharmacy',
    'Block A',
    'Floor 1',
    'Room 105',
    'Counter P-3 (Dispensing)',
    '{"x": 80, "y": 140}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 5. AUDIT LOG INITIALIZATION
INSERT INTO public.audit_logs (id, actor_id, role, hospital_id, action, resource, timestamp, metadata)
VALUES
(
    gen_random_uuid(),
    NULL,
    'HOSPITAL_ADMIN',
    '11111111-1111-1111-1111-111111111111',
    'SYSTEM_INIT',
    'hospitals',
    now(),
    '{"event": "Hospital Portal operational schema initialized with standard departments and navigation map"}'::jsonb
);
