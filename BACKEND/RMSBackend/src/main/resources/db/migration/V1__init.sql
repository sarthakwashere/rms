-- RMS Backend schema (v0)
-- Note: UUIDs are stored as uuid type; frontend uses strings.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Allocations
-- ---------------------------------------------------------------------------
create table if not exists allocations (
    allocation_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    flight_id text not null,
    resource_type text not null,
    resource_id text not null,

    start_time timestamptz not null,
    end_time timestamptz not null,

    status text not null,
    allocation_mode text not null,
    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_allocations_tenant on allocations (tenant_id);
create index if not exists idx_allocations_resource_time on allocations (tenant_id, resource_type, resource_id, start_time, end_time);
create index if not exists idx_allocations_flight on allocations (tenant_id, flight_id);

-- ---------------------------------------------------------------------------
-- Conflicts (minimal for UI)
-- ---------------------------------------------------------------------------
create table if not exists conflicts (
    conflict_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    conflict_type text not null,
    severity text not null,
    status text not null,
    resource_type text,
    conflict_description text not null,

    detected_at timestamptz not null default now()
);

create index if not exists idx_conflicts_tenant on conflicts (tenant_id);
create index if not exists idx_conflicts_status_sev on conflicts (tenant_id, status, severity);

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------
create table if not exists rules (
    rule_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    rule_name text not null,
    resource_type text not null,
    priority int not null,
    scoring_criteria jsonb not null default '{}'::jsonb,
    applicable_airlines jsonb not null default '[]'::jsonb,
    applicable_terminals jsonb not null default '[]'::jsonb,
    time_windows jsonb not null default '[]'::jsonb,
    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_rules_tenant on rules (tenant_id);

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------
create table if not exists constraints (
    constraint_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    constraint_name text not null,
    resource_type text,
    constraint_type text not null,
    constraint_definition jsonb not null default '{}'::jsonb,
    is_hard_constraint boolean not null default true,
    penalty_score numeric,
    is_active boolean not null default true,

    created_at timestamptz not null default now()
);

create index if not exists idx_constraints_tenant on constraints (tenant_id);

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
create table if not exists templates (
    template_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    template_name text not null,
    template_type text not null,
    description text,
    resource_types jsonb not null default '[]'::jsonb,
    template_data jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    used_count int not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_templates_tenant on templates (tenant_id);

-- ---------------------------------------------------------------------------
-- Simulations
-- ---------------------------------------------------------------------------
create table if not exists simulations (
    simulation_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    simulation_name text not null,
    base_date text not null,
    scenario_type text not null,
    scenario_parameters jsonb not null default '{}'::jsonb,
    status text not null default 'created',
    results jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_simulations_tenant on simulations (tenant_id);

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
    audit_id uuid primary key default gen_random_uuid(),
    tenant_id text not null,

    event_type text not null,
    entity_type text,
    entity_id text,
    actor text,
    details jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

create index if not exists idx_audit_tenant on audit_log (tenant_id, created_at desc);

