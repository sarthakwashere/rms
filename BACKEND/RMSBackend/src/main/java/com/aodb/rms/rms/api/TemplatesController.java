package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import com.aodb.rms.rms.model.TemplateEntity;
import com.aodb.rms.rms.repo.TemplateRepository;
import com.aodb.rms.tenant.TenantContext;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rms/templates")
public class TemplatesController {
    private final TemplateRepository templates;
    private final ApiJson json;

    public TemplatesController(TemplateRepository templates, ApiJson json) {
        this.templates = templates;
        this.json = json;
    }

    @GetMapping
    public List<OtherDtos.TemplateResponse> list() {
        String tenantId = TenantContext.getTenantId();
        return templates.findByTenantIdOrderByUpdatedAtDesc(tenantId).stream()
                .map(TemplatesController::toDto)
                .toList();
    }

    @PostMapping
    public OtherDtos.TemplateResponse create(@RequestBody OtherDtos.TemplateCreateUpdateRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (req.template_name() == null || req.template_name().isBlank()) throw new IllegalArgumentException("template_name is required");
        if (req.template_type() == null || req.template_type().isBlank()) throw new IllegalArgumentException("template_type is required");

        TemplateEntity e = new TemplateEntity();
        e.setTenantId(TenantContext.getTenantId());
        e.setTemplateName(req.template_name());
        e.setTemplateType(req.template_type());
        e.setDescription(req.description());
        e.setResourceTypes(defaultArr(req.resource_types()));
        e.setTemplateData(defaultObj(req.template_data()));
        e.setActive(req.is_active() == null || req.is_active());

        return toDto(templates.save(e));
    }

    @PatchMapping("/{id}")
    public OtherDtos.TemplateResponse patch(@PathVariable("id") String id, @RequestBody OtherDtos.TemplateCreateUpdateRequest req) {
        UUID templateId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        TemplateEntity e = templates.findByTemplateIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new NotFoundException("Template not found"));

        if (req.template_name() != null) e.setTemplateName(req.template_name());
        if (req.template_type() != null) e.setTemplateType(req.template_type());
        if (req.description() != null) e.setDescription(req.description());
        if (req.resource_types() != null) e.setResourceTypes(req.resource_types());
        if (req.template_data() != null) e.setTemplateData(req.template_data());
        if (req.is_active() != null) e.setActive(req.is_active());

        return toDto(templates.save(e));
    }

    @PostMapping("/{id}/apply")
    public OtherDtos.TemplateApplyResponse apply(@PathVariable("id") String id, @RequestBody OtherDtos.TemplateApplyRequest req) {
        UUID templateId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        TemplateEntity e = templates.findByTemplateIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new NotFoundException("Template not found"));

        // v0: we don't generate allocations from template_data yet.
        e.setUsedCount(e.getUsedCount() + 1);
        templates.save(e);

        return new OtherDtos.TemplateApplyResponse(0);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        UUID templateId = UUID.fromString(id);
        String tenantId = TenantContext.getTenantId();
        TemplateEntity e = templates.findByTemplateIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new NotFoundException("Template not found"));
        templates.delete(e);
        return ResponseEntity.noContent().build();
    }

    private JsonNode defaultObj(JsonNode n) {
        return (n == null || n.isNull()) ? json.obj() : n;
    }

    private JsonNode defaultArr(JsonNode n) {
        return (n == null || n.isNull()) ? json.arr() : n;
    }

    private static OtherDtos.TemplateResponse toDto(TemplateEntity t) {
        return new OtherDtos.TemplateResponse(
                t.getTemplateId().toString(),
                t.getTenantId(),
                t.getTemplateName(),
                t.getTemplateType(),
                t.getDescription(),
                t.getResourceTypes(),
                t.getTemplateData(),
                t.isActive(),
                t.getUsedCount(),
                t.getCreatedAt().toString(),
                t.getUpdatedAt().toString()
        );
    }
}

