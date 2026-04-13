package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import com.aodb.rms.rms.model.SimulationEntity;
import com.aodb.rms.rms.repo.SimulationRepository;
import com.aodb.rms.tenant.TenantContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rms/simulations")
public class SimulationsController {
    private final SimulationRepository simulations;
    private final ApiJson json;

    public SimulationsController(SimulationRepository simulations, ApiJson json) {
        this.simulations = simulations;
        this.json = json;
    }

    @GetMapping
    public List<OtherDtos.SimulationResponse> list() {
        String tenantId = TenantContext.getTenantId();
        return simulations.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(SimulationsController::toDto)
                .toList();
    }

    @PostMapping
    public OtherDtos.SimulationResponse create(@RequestBody OtherDtos.SimulationCreateRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (req.simulation_name() == null || req.simulation_name().isBlank()) throw new IllegalArgumentException("simulation_name is required");
        if (req.base_date() == null || req.base_date().isBlank()) throw new IllegalArgumentException("base_date is required");
        if (req.scenario_type() == null || req.scenario_type().isBlank()) throw new IllegalArgumentException("scenario_type is required");

        SimulationEntity e = new SimulationEntity();
        e.setTenantId(TenantContext.getTenantId());
        e.setSimulationName(req.simulation_name());
        e.setBaseDate(req.base_date());
        e.setScenarioType(req.scenario_type());
        e.setScenarioParameters(defaultObj(req.scenario_parameters()));
        e.setStatus("created");

        return toDto(simulations.save(e));
    }

    @PostMapping("/{id}/run")
    public OtherDtos.SimulationRunResult run(@PathVariable("id") String id) {
        UUID simId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        SimulationEntity e = simulations.findBySimulationIdAndTenantId(simId, tenantId)
                .orElseThrow(() -> new NotFoundException("Simulation not found"));

        e.setStatus("running");
        simulations.save(e);

        // v0 stub results
        ObjectNode results = json.obj();
        results.put("allocations_changed", 0);
        results.put("new_conflicts", 0);
        results.put("resolved_conflicts", 0);
        results.put("score_improvement_pct", 0.0);

        e.setStatus("completed");
        e.setResults(results);
        simulations.save(e);

        return new OtherDtos.SimulationRunResult(
                e.getSimulationId().toString(),
                e.getStatus(),
                0,
                0,
                0,
                0.0
        );
    }

    @PostMapping("/{id}/apply")
    public OtherDtos.SimulationApplyResponse apply(@PathVariable("id") String id) {
        UUID simId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        SimulationEntity e = simulations.findBySimulationIdAndTenantId(simId, tenantId)
                .orElseThrow(() -> new NotFoundException("Simulation not found"));

        if (!"completed".equalsIgnoreCase(e.getStatus())) {
            throw new IllegalArgumentException("Simulation must be completed before apply");
        }

        // v0: no-op apply
        return new OtherDtos.SimulationApplyResponse(true, "Applied (no-op v0)");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        UUID simId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        SimulationEntity e = simulations.findBySimulationIdAndTenantId(simId, tenantId)
                .orElseThrow(() -> new NotFoundException("Simulation not found"));
        simulations.delete(e);
        return ResponseEntity.noContent().build();
    }

    private JsonNode defaultObj(JsonNode n) {
        return (n == null || n.isNull()) ? json.obj() : n;
    }

    private static OtherDtos.SimulationResponse toDto(SimulationEntity s) {
        return new OtherDtos.SimulationResponse(
                s.getSimulationId().toString(),
                s.getTenantId(),
                s.getSimulationName(),
                s.getBaseDate(),
                s.getScenarioType(),
                s.getScenarioParameters(),
                s.getStatus(),
                s.getResults(),
                s.getCreatedAt().toString(),
                s.getUpdatedAt().toString()
        );
    }
}

