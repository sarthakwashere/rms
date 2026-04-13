-- Demo allocation rules for UI / stakeholder demos (tenant: default).
-- Safe to re-apply: fixed rule_ids; skip if already present.

INSERT INTO rules (
    rule_id,
    tenant_id,
    rule_name,
    resource_type,
    priority,
    scoring_criteria,
    applicable_airlines,
    applicable_terminals,
    time_windows,
    is_active
) VALUES
(
    'a0000001-0000-4000-8000-000000000001'::uuid,
    'default',
    'T2 Intl — contact stand scoring',
    'STAND',
    1,
    '{"terminal_match":12,"airline_affinity":10,"contact_stand_preference":9,"passenger_walk_distance":8,"turnaround_stand_fit":7,"utilisation_balance":5}'::jsonb,
    '["BA","LH"]'::jsonb,
    '["T2"]'::jsonb,
    '[]'::jsonb,
    true
),
(
    'a0000001-0000-4000-8000-000000000002'::uuid,
    'default',
    'Default gate — terminal + balance',
    'GATE',
    10,
    '{"terminal_match":10,"utilisation_balance":10}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    true
)
ON CONFLICT (rule_id) DO NOTHING;
