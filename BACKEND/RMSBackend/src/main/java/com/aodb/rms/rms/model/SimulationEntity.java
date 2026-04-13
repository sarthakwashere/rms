package com.aodb.rms.rms.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "simulations")
public class SimulationEntity {
    @Id
    @Column(name = "simulation_id", nullable = false)
    private UUID simulationId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "simulation_name", nullable = false)
    private String simulationName;

    @Column(name = "base_date", nullable = false)
    private String baseDate;

    @Column(name = "scenario_type", nullable = false)
    private String scenarioType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scenario_parameters", nullable = false, columnDefinition = "jsonb")
    private JsonNode scenarioParameters;

    @Column(name = "status", nullable = false)
    private String status = "created";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "results", columnDefinition = "jsonb")
    private JsonNode results;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (simulationId == null) simulationId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getSimulationId() {
        return simulationId;
    }

    public void setSimulationId(UUID simulationId) {
        this.simulationId = simulationId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSimulationName() {
        return simulationName;
    }

    public void setSimulationName(String simulationName) {
        this.simulationName = simulationName;
    }

    public String getBaseDate() {
        return baseDate;
    }

    public void setBaseDate(String baseDate) {
        this.baseDate = baseDate;
    }

    public String getScenarioType() {
        return scenarioType;
    }

    public void setScenarioType(String scenarioType) {
        this.scenarioType = scenarioType;
    }

    public JsonNode getScenarioParameters() {
        return scenarioParameters;
    }

    public void setScenarioParameters(JsonNode scenarioParameters) {
        this.scenarioParameters = scenarioParameters;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public JsonNode getResults() {
        return results;
    }

    public void setResults(JsonNode results) {
        this.results = results;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

