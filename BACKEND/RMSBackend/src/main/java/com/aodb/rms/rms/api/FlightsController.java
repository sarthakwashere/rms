package com.aodb.rms.rms.api;

import com.aodb.rms.tenant.TenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/flights")
public class FlightsController {

    public record FlightResponse(
            String flight_id,
            String flight_number,
            String airline_code,
            String movement_type,
            String status,
            String std,
            String sta,
            String gate_id,
            String stand_id,
            String belt_id
    ) {}

    public record FlightListResponse(List<FlightResponse> data) {}

    @GetMapping
    public FlightListResponse list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "date_from", required = false) String dateFrom,
            @RequestParam(value = "date_to", required = false) String dateTo,
            @RequestParam(value = "page_size", required = false) Integer pageSize
    ) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) tenantId = "default";

        // Simple v0 stub payload matching frontend expectations.
        List<FlightResponse> data = List.of(
                new FlightResponse(
                        "flt-" + tenantId + "-001",
                        "AI101",
                        "AI",
                        "DEP",
                        "SCHEDULED",
                        "2026-04-10T10:00:00Z",
                        null,
                        "gate-a1",
                        "stand-1",
                        "belt-1"
                ),
                new FlightResponse(
                        "flt-" + tenantId + "-002",
                        "UK202",
                        "UK",
                        "ARR",
                        "SCHEDULED",
                        null,
                        "2026-04-10T11:15:00Z",
                        "gate-a2",
                        "stand-2",
                        "belt-2"
                )
        );
        return new FlightListResponse(data);
    }
}

