package com.aodb.rms.rms.api.dto;

public final class AllocationDtos {
    private AllocationDtos() {}

    public record AllocateRequest(
            String flight_id,
            String resource_type,
            String resource_id,
            String start_time,
            String end_time,
            String notes,
            Boolean force_override
    ) {}

    public record AllocationResponse(
            String allocation_id,
            String tenant_id,
            String flight_id,
            String resource_type,
            String resource_id,
            String start_time,
            String end_time,
            String status,
            String allocation_mode,
            String notes,
            String created_at,
            String updated_at
    ) {}

    public record ReleaseResponse(String status) {}

    public record ReallocateRequest(String resource_id, String reason) {}
}

