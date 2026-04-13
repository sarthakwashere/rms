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
@Table(name = "rules")
public class RuleEntity {
    @Id
    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "priority", nullable = false)
    private int priority;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scoring_criteria", nullable = false, columnDefinition = "jsonb")
    private JsonNode scoringCriteria;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "applicable_airlines", nullable = false, columnDefinition = "jsonb")
    private JsonNode applicableAirlines;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "applicable_terminals", nullable = false, columnDefinition = "jsonb")
    private JsonNode applicableTerminals;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "time_windows", nullable = false, columnDefinition = "jsonb")
    private JsonNode timeWindows;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (ruleId == null) ruleId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getRuleId() {
        return ruleId;
    }

    public void setRuleId(UUID ruleId) {
        this.ruleId = ruleId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public JsonNode getScoringCriteria() {
        return scoringCriteria;
    }

    public void setScoringCriteria(JsonNode scoringCriteria) {
        this.scoringCriteria = scoringCriteria;
    }

    public JsonNode getApplicableAirlines() {
        return applicableAirlines;
    }

    public void setApplicableAirlines(JsonNode applicableAirlines) {
        this.applicableAirlines = applicableAirlines;
    }

    public JsonNode getApplicableTerminals() {
        return applicableTerminals;
    }

    public void setApplicableTerminals(JsonNode applicableTerminals) {
        this.applicableTerminals = applicableTerminals;
    }

    public JsonNode getTimeWindows() {
        return timeWindows;
    }

    public void setTimeWindows(JsonNode timeWindows) {
        this.timeWindows = timeWindows;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
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

