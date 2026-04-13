package com.aodb.rms.rms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conflicts")
public class ConflictEntity {
    @Id
    @Column(name = "conflict_id", nullable = false)
    private UUID conflictId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "conflict_type", nullable = false)
    private String conflictType;

    @Column(name = "severity", nullable = false)
    private String severity;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "conflict_description", nullable = false)
    private String conflictDescription;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @PrePersist
    void prePersist() {
        if (conflictId == null) conflictId = UUID.randomUUID();
        if (detectedAt == null) detectedAt = Instant.now();
    }

    public UUID getConflictId() {
        return conflictId;
    }

    public void setConflictId(UUID conflictId) {
        this.conflictId = conflictId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getConflictType() {
        return conflictType;
    }

    public void setConflictType(String conflictType) {
        this.conflictType = conflictType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getConflictDescription() {
        return conflictDescription;
    }

    public void setConflictDescription(String conflictDescription) {
        this.conflictDescription = conflictDescription;
    }

    public Instant getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(Instant detectedAt) {
        this.detectedAt = detectedAt;
    }
}

