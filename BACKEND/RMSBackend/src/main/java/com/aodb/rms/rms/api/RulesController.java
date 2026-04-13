package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import com.aodb.rms.rms.model.RuleEntity;
import com.aodb.rms.rms.repo.RuleRepository;
import com.aodb.rms.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rms/rules")
public class RulesController {
    private static final TypeReference<Map<String, Object>> MAP_STRING_OBJECT = new TypeReference<>() {};
    private static final TypeReference<List<Object>> LIST_OBJECT = new TypeReference<>() {};

    private final RuleRepository rules;
    private final ApiJson json;

    public RulesController(RuleRepository rules, ApiJson json) {
        this.rules = rules;
        this.json = json;
    }

    @GetMapping
    public List<OtherDtos.RuleResponse> list() {
        String tenantId = TenantContext.getTenantId();
        return rules.findByTenantIdOrderByPriorityAsc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    public OtherDtos.RuleResponse create(@RequestBody OtherDtos.RuleCreateUpdateRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (req.rule_name() == null || req.rule_name().isBlank()) throw new IllegalArgumentException("rule_name is required");
        if (req.resource_type() == null || req.resource_type().isBlank()) throw new IllegalArgumentException("resource_type is required");
        if (req.priority() == null) throw new IllegalArgumentException("priority is required");

        RuleEntity e = new RuleEntity();
        e.setTenantId(TenantContext.getTenantId());
        e.setRuleName(req.rule_name());
        e.setResourceType(req.resource_type());
        e.setPriority(req.priority());
        e.setScoringCriteria(json.valueToTree(req.scoring_criteria() != null ? req.scoring_criteria() : Map.of()));
        e.setApplicableAirlines(json.valueToTree(req.applicable_airlines() != null ? req.applicable_airlines() : List.of()));
        e.setApplicableTerminals(json.valueToTree(req.applicable_terminals() != null ? req.applicable_terminals() : List.of()));
        e.setTimeWindows(json.valueToTree(req.time_windows() != null ? req.time_windows() : List.of()));
        e.setActive(req.is_active() == null || req.is_active());

        return toDto(rules.save(e));
    }

    @PatchMapping("/{id}")
    public OtherDtos.RuleResponse patch(@PathVariable("id") String id, @RequestBody OtherDtos.RuleCreateUpdateRequest req) {
        UUID ruleId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        RuleEntity e = rules.findByRuleIdAndTenantId(ruleId, tenantId).orElseThrow(() -> new NotFoundException("Rule not found"));

        if (req.rule_name() != null) e.setRuleName(req.rule_name());
        if (req.resource_type() != null) e.setResourceType(req.resource_type());
        if (req.priority() != null) e.setPriority(req.priority());
        if (req.scoring_criteria() != null) e.setScoringCriteria(json.valueToTree(req.scoring_criteria()));
        if (req.applicable_airlines() != null) e.setApplicableAirlines(json.valueToTree(req.applicable_airlines()));
        if (req.applicable_terminals() != null) e.setApplicableTerminals(json.valueToTree(req.applicable_terminals()));
        if (req.time_windows() != null) e.setTimeWindows(json.valueToTree(req.time_windows()));
        if (req.is_active() != null) e.setActive(req.is_active());

        return toDto(rules.save(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        UUID ruleId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        RuleEntity e = rules.findByRuleIdAndTenantId(ruleId, tenantId).orElseThrow(() -> new NotFoundException("Rule not found"));
        rules.delete(e);
        return ResponseEntity.noContent().build();
    }

    private OtherDtos.RuleResponse toDto(RuleEntity r) {
        var m = json.mapper();
        return new OtherDtos.RuleResponse(
                r.getRuleId().toString(),
                r.getTenantId(),
                r.getRuleName(),
                r.getResourceType(),
                r.getPriority(),
                m.convertValue(r.getScoringCriteria(), MAP_STRING_OBJECT),
                m.convertValue(r.getApplicableAirlines(), LIST_OBJECT),
                m.convertValue(r.getApplicableTerminals(), LIST_OBJECT),
                m.convertValue(r.getTimeWindows(), LIST_OBJECT),
                r.isActive(),
                r.getCreatedAt().toString(),
                r.getUpdatedAt().toString()
        );
    }
}

