package com.aodb.rms.rms.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "constraints")
public class ConstraintEntity {
    @Id
    @Column(name = "constraint_id", nullable = false)
    private UUID constraintId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "constraint_name", nullable = false)
    private String constraintName;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "constraint_type", nullable = false)
    private String constraintType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "constraint_definition", nullable = false, columnDefinition = "jsonb")
    private JsonNode constraintDefinition;

    @Column(name = "is_hard_constraint", nullable = false)
    private boolean isHardConstraint = true;

    @Column(name = "penalty_score")
    private Double penaltyScore;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (constraintId == null) constraintId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getConstraintId() {
        return constraintId;
    }

    public void setConstraintId(UUID constraintId) {
        this.constraintId = constraintId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getConstraintName() {
        return constraintName;
    }

    public void setConstraintName(String constraintName) {
        this.constraintName = constraintName;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getConstraintType() {
        return constraintType;
    }

    public void setConstraintType(String constraintType) {
        this.constraintType = constraintType;
    }

    public JsonNode getConstraintDefinition() {
        return constraintDefinition;
    }

    public void setConstraintDefinition(JsonNode constraintDefinition) {
        this.constraintDefinition = constraintDefinition;
    }

    public boolean isHardConstraint() {
        return isHardConstraint;
    }

    public void setHardConstraint(boolean hardConstraint) {
        isHardConstraint = hardConstraint;
    }

    public Double getPenaltyScore() {
        return penaltyScore;
    }

    public void setPenaltyScore(Double penaltyScore) {
        this.penaltyScore = penaltyScore;
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
}

