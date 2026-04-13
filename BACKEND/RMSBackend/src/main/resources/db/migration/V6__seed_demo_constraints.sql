-- Demo constraints for stakeholder UI (tenant: default). Idempotent on constraint_id.

INSERT INTO constraints (
    constraint_id,
    tenant_id,
    constraint_name,
    resource_type,
    constraint_type,
    constraint_definition,
    is_hard_constraint,
    penalty_score,
    is_active,
    created_at
) VALUES
(
    'b0000001-0000-4000-8000-000000000001'::uuid,
    'default',
    'Stand — max ICAO Code E (widebody cap)',
    'STAND',
    'aircraft_size',
    '{"max_icao_aircraft_code":"E","description":"Reject Code F / A380 unless coordinator override","reference":"ICAO Annex 14 stand compatibility"}'::jsonb,
    true,
    NULL,
    true,
    now()
),
(
    'b0000001-0000-4000-8000-000000000002'::uuid,
    'default',
    'Gate — terminal must match flight',
    'GATE',
    'terminal_match',
    '{"enforce_same_terminal":true,"allow_cross_terminal_with_approval":false,"description":"Outbound gate in same terminal as check-in zone where possible"}'::jsonb,
    true,
    NULL,
    true,
    now()
),
(
    'b0000001-0000-4000-8000-000000000003'::uuid,
    'default',
    'Stand S42 — weekly maintenance window',
    'STAND',
    'availability',
    '{"blocked_windows":[{"day_of_week":"WED","local_start":"02:00","local_end":"06:00","timezone":"airport_local","reason":"preventive_maintenance"}],"resource_id_hint":"S42"}'::jsonb,
    false,
    250.0,
    true,
    now()
),
(
    'b0000001-0000-4000-8000-000000000004'::uuid,
    'default',
    'Make-up belt — concurrent flight cap',
    'BELT',
    'capacity',
    '{"max_simultaneous_allocations":2,"scope":"same_belt_same_window","description":"Avoid overloading BHS sort lane during peak bank"}'::jsonb,
    false,
    80.0,
    true,
    now()
)
ON CONFLICT (constraint_id) DO NOTHING;
