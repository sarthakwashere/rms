-- Demo what-if simulations for stakeholder walkthroughs (tenant: default)

INSERT INTO simulations (
    simulation_id,
    tenant_id,
    simulation_name,
    base_date,
    scenario_type,
    scenario_parameters,
    status,
    results,
    created_at,
    updated_at
) VALUES
(
    'c0000001-0000-4000-8000-000000000001'::uuid,
    'default',
    'Morning Intl Bank — Rule Weight Shift',
    '2026-04-14',
    'rule_change',
    '{"target_rules":["T2 Intl — contact stand optimization"],"weight_adjustments":{"contact_stand_preference":2,"passenger_walk_distance":1},"window":{"start_local":"05:00","end_local":"11:00"}}'::jsonb,
    'completed',
    '{"allocations_changed":14,"new_conflicts":1,"resolved_conflicts":5,"score_improvement_pct":6.8}'::jsonb,
    now() - interval '2 days',
    now() - interval '2 days'
),
(
    'c0000001-0000-4000-8000-000000000002'::uuid,
    'default',
    'Stand S42 Maintenance Impact',
    '2026-04-15',
    'constraint_test',
    '{"constraints":["Stand S42 — weekly maintenance window"],"blocked_resources":["S42"],"analysis_horizon_hours":8}'::jsonb,
    'completed',
    '{"allocations_changed":9,"new_conflicts":2,"resolved_conflicts":1,"score_improvement_pct":-1.4}'::jsonb,
    now() - interval '1 day',
    now() - interval '1 day'
),
(
    'c0000001-0000-4000-8000-000000000003'::uuid,
    'default',
    'Evening Departures — Belt Capacity Stress',
    '2026-04-16',
    'capacity_planning',
    '{"resource_type":"BELT","capacity_delta_pct":-20,"peak_window":{"start_local":"17:00","end_local":"22:00"},"include_charter_flights":true}'::jsonb,
    'running',
    NULL,
    now() - interval '3 hours',
    now() - interval '10 minutes'
),
(
    'c0000001-0000-4000-8000-000000000004'::uuid,
    'default',
    'Severe Weather Diversion Playbook',
    '2026-04-17',
    'what_if',
    '{"event":"thunderstorm_diversion","extra_inbound_flights":6,"remote_stand_preference":true,"priority_airlines":["LH","EK"],"notes":"Test diversion handling for 90-min disruption"}'::jsonb,
    'created',
    NULL,
    now() - interval '45 minutes',
    now() - interval '45 minutes'
),
(
    'c0000001-0000-4000-8000-000000000005'::uuid,
    'default',
    'Cross-Terminal Gate Swap Scenario',
    '2026-04-18',
    'what_if',
    '{"swap_candidates":["G12","G24","G31"],"allow_cross_terminal":false,"goal":"reduce_mct_risk"}'::jsonb,
    'failed',
    '{"error":"Insufficient compatible stands for Code E flights in horizon"}'::jsonb,
    now() - interval '5 hours',
    now() - interval '4 hours 45 minutes'
)
ON CONFLICT (simulation_id) DO NOTHING;
