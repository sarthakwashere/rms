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
@Table(name = "templates")
public class TemplateEntity {
    @Id
    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(name = "template_type", nullable = false)
    private String templateType;

    @Column(name = "description")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resource_types", nullable = false, columnDefinition = "jsonb")
    private JsonNode resourceTypes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "template_data", nullable = false, columnDefinition = "jsonb")
    private JsonNode templateData;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        if (templateId == null) templateId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getTemplateId() {
        return templateId;
    }

    public void setTemplateId(UUID templateId) {
        this.templateId = templateId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public JsonNode getResourceTypes() {
        return resourceTypes;
    }

    public void setResourceTypes(JsonNode resourceTypes) {
        this.resourceTypes = resourceTypes;
    }

    public JsonNode getTemplateData() {
        return templateData;
    }

    public void setTemplateData(JsonNode templateData) {
        this.templateData = templateData;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public void setUsedCount(int usedCount) {
        this.usedCount = usedCount;
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

