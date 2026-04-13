package com.aodb.rms.rms.api.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

public final class OtherDtos {
    private OtherDtos() {}

    public record ConflictResponse(
            String conflict_id,
            String conflict_type,
            String severity,
            String status,
            String resource_type,
            String resource_id,
            String conflict_description,
            String detected_at
    ) {}

    public record RunAllocationResult(int allocated) {}

    public record RuleCreateUpdateRequest(
            String rule_name,
            String resource_type,
            Integer priority,
            Map<String, Object> scoring_criteria,
            List<Object> applicable_airlines,
            List<Object> applicable_terminals,
            List<Object> time_windows,
            Boolean is_active
    ) {}

    public record RuleResponse(
            String rule_id,
            String tenant_id,
            String rule_name,
            String resource_type,
            int priority,
            Map<String, Object> scoring_criteria,
            List<Object> applicable_airlines,
            List<Object> applicable_terminals,
            List<Object> time_windows,
            boolean is_active,
            String created_at,
            String updated_at
    ) {}

    public record ConstraintCreateUpdateRequest(
            String constraint_name,
            String resource_type,
            String constraint_type,
            Map<String, Object> constraint_definition,
            Boolean is_hard_constraint,
            Double penalty_score,
            Boolean is_active
    ) {}

    public record ConstraintResponse(
            String constraint_id,
            String tenant_id,
            String constraint_name,
            String resource_type,
            String constraint_type,
            Map<String, Object> constraint_definition,
            boolean is_hard_constraint,
            Double penalty_score,
            boolean is_active,
            String created_at
    ) {}

    public record TemplateCreateUpdateRequest(
            String template_name,
            String template_type,
            String description,
            JsonNode resource_types,
            JsonNode template_data,
            Boolean is_active
    ) {}

    public record TemplateResponse(
            String template_id,
            String tenant_id,
            String template_name,
            String template_type,
            String description,
            JsonNode resource_types,
            JsonNode template_data,
            boolean is_active,
            int used_count,
            String created_at,
            String updated_at
    ) {}

    public record TemplateApplyRequest(String date_from, String date_to) {}
    public record TemplateApplyResponse(int allocations_created) {}

    public record SimulationCreateRequest(
            String simulation_name,
            String base_date,
            String scenario_type,
            JsonNode scenario_parameters
    ) {}

    public record SimulationResponse(
            String simulation_id,
            String tenant_id,
            String simulation_name,
            String base_date,
            String scenario_type,
            JsonNode scenario_parameters,
            String status,
            JsonNode results,
            String created_at,
            String updated_at
    ) {}

    public record SimulationRunResult(
            String simulation_id,
            String status,
            int allocations_changed,
            int new_conflicts,
            int resolved_conflicts,
            double score_improvement_pct
    ) {}

    public record SimulationApplyResponse(boolean success, String message) {}
}

