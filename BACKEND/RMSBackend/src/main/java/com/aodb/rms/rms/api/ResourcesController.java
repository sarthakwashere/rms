package com.aodb.rms.rms.api;

import com.aodb.rms.tenant.TenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
public class ResourcesController {

    public record StandResponse(
            String stand_id,
            String tenant_id,
            String stand_code,
            String terminal_id,
            String stand_type,
            Double max_wingspan_m,
            boolean is_active
    ) {}

    public record BeltResponse(
            String belt_id,
            String tenant_id,
            String belt_code,
            boolean is_active
    ) {}

    public record RunwayResponse(
            String runway_id,
            String tenant_id,
            String runway_code,
            Integer length_m,
            boolean is_active
    ) {}

    public record TerminalResponse(
            String terminal_id,
            String tenant_id,
            String terminal_code,
            String terminal_name,
            boolean is_active
    ) {}

    @GetMapping("/stands")
    public List<StandResponse> stands() {
        String tenantId = tenantId();
        return List.of(
                new StandResponse("stand-1", tenantId, "S01", "T1", "CONTACT", 65.0, true),
                new StandResponse("stand-2", tenantId, "S02", "T1", "REMOTE", 52.0, true)
        );
    }

    @GetMapping("/belts")
    public List<BeltResponse> belts() {
        String tenantId = tenantId();
        return List.of(
                new BeltResponse("belt-1", tenantId, "B01", true),
                new BeltResponse("belt-2", tenantId, "B02", true)
        );
    }

    @GetMapping("/runways")
    public List<RunwayResponse> runways() {
        String tenantId = tenantId();
        return List.of(
                new RunwayResponse("runway-09", tenantId, "09/27", 3800, true),
                new RunwayResponse("runway-14", tenantId, "14/32", 3200, true)
        );
    }

    @GetMapping("/terminals")
    public List<TerminalResponse> terminals() {
        String tenantId = tenantId();
        return List.of(
                new TerminalResponse("terminal-1", tenantId, "T1", "Terminal 1", true),
                new TerminalResponse("terminal-2", tenantId, "T2", "Terminal 2", true)
        );
    }

    private String tenantId() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId == null || tenantId.isBlank()) ? "default" : tenantId;
    }
}

