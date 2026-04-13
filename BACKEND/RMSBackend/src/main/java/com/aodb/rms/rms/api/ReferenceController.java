package com.aodb.rms.rms.api;

import com.aodb.rms.tenant.TenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ref")
public class ReferenceController {

    public record GateResponse(
            String gate_id,
            String tenant_id,
            String gate_code,
            String terminal_id,
            boolean is_active
    ) {}

    @GetMapping("/gates")
    public List<GateResponse> gates() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) tenantId = "default";
        return List.of(
                new GateResponse("gate-a1", tenantId, "A1", "T1", true),
                new GateResponse("gate-a2", tenantId, "A2", "T1", true),
                new GateResponse("gate-b1", tenantId, "B1", "T2", true)
        );
    }
}

