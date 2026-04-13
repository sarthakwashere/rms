package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import com.aodb.rms.rms.repo.ConflictRepository;
import com.aodb.rms.tenant.TenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rms/conflicts")
public class ConflictController {
    private final ConflictRepository conflicts;

    public ConflictController(ConflictRepository conflicts) {
        this.conflicts = conflicts;
    }

    @GetMapping
    public List<OtherDtos.ConflictResponse> list() {
        String tenantId = TenantContext.getTenantId();
        return conflicts.findByTenantIdOrderByDetectedAtDesc(tenantId).stream()
                .map(c -> new OtherDtos.ConflictResponse(
                        c.getConflictId().toString(),
                        c.getConflictType(),
                        c.getSeverity(),
                        c.getStatus(),
                        c.getResourceType(),
                        c.getResourceId() != null ? c.getResourceId() : "",
                        c.getConflictDescription(),
                        c.getDetectedAt().toString()
                ))
                .toList();
    }
}

