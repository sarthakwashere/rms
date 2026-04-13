package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import com.aodb.rms.rms.model.ConstraintEntity;
import com.aodb.rms.rms.repo.ConstraintRepository;
import com.aodb.rms.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rms/constraints")
public class ConstraintsController {
    private static final TypeReference<Map<String, Object>> MAP_STRING_OBJECT = new TypeReference<>() {};

    private final ConstraintRepository constraints;
    private final ApiJson json;

    public ConstraintsController(ConstraintRepository constraints, ApiJson json) {
        this.constraints = constraints;
        this.json = json;
    }

    @GetMapping
    public List<OtherDtos.ConstraintResponse> list() {
        String tenantId = TenantContext.getTenantId();
        return constraints.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    public OtherDtos.ConstraintResponse create(@RequestBody OtherDtos.ConstraintCreateUpdateRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (req.constraint_name() == null || req.constraint_name().isBlank()) throw new IllegalArgumentException("constraint_name is required");
        if (req.constraint_type() == null || req.constraint_type().isBlank()) throw new IllegalArgumentException("constraint_type is required");

        ConstraintEntity e = new ConstraintEntity();
        e.setTenantId(TenantContext.getTenantId());
        e.setConstraintName(req.constraint_name());
        e.setResourceType(req.resource_type());
        e.setConstraintType(req.constraint_type());
        e.setConstraintDefinition(json.valueToTree(req.constraint_definition() != null ? req.constraint_definition() : Map.of()));
        e.setHardConstraint(req.is_hard_constraint() == null || req.is_hard_constraint());
        e.setPenaltyScore(req.penalty_score());
        e.setActive(req.is_active() == null || req.is_active());

        return toDto(constraints.save(e));
    }

    @PatchMapping("/{id}")
    public OtherDtos.ConstraintResponse patch(@PathVariable("id") String id, @RequestBody OtherDtos.ConstraintCreateUpdateRequest req) {
        UUID constraintId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        ConstraintEntity e = constraints.findByConstraintIdAndTenantId(constraintId, tenantId)
                .orElseThrow(() -> new NotFoundException("Constraint not found"));

        if (req.constraint_name() != null) e.setConstraintName(req.constraint_name());
        if (req.resource_type() != null) e.setResourceType(req.resource_type());
        if (req.constraint_type() != null) e.setConstraintType(req.constraint_type());
        if (req.constraint_definition() != null) e.setConstraintDefinition(json.valueToTree(req.constraint_definition()));
        if (req.is_hard_constraint() != null) e.setHardConstraint(req.is_hard_constraint());
        if (req.penalty_score() != null) e.setPenaltyScore(req.penalty_score());
        if (req.is_active() != null) e.setActive(req.is_active());

        return toDto(constraints.save(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        UUID constraintId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        ConstraintEntity e = constraints.findByConstraintIdAndTenantId(constraintId, tenantId)
                .orElseThrow(() -> new NotFoundException("Constraint not found"));
        constraints.delete(e);
        return ResponseEntity.noContent().build();
    }

    private OtherDtos.ConstraintResponse toDto(ConstraintEntity c) {
        var m = json.mapper();
        return new OtherDtos.ConstraintResponse(
                c.getConstraintId().toString(),
                c.getTenantId(),
                c.getConstraintName(),
                c.getResourceType(),
                c.getConstraintType(),
                m.convertValue(c.getConstraintDefinition(), MAP_STRING_OBJECT),
                c.isHardConstraint(),
                c.getPenaltyScore(),
                c.isActive(),
                c.getCreatedAt().toString()
        );
    }
}

