package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.AllocationDtos;
import com.aodb.rms.rms.model.AllocationEntity;
import com.aodb.rms.rms.repo.AllocationRepository;
import com.aodb.rms.rms.service.ResourceOverlapConflictService;
import com.aodb.rms.tenant.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rms/allocations")
public class AllocationController {
    private final AllocationRepository allocations;
    private final ResourceOverlapConflictService overlapConflicts;

    public AllocationController(AllocationRepository allocations, ResourceOverlapConflictService overlapConflicts) {
        this.allocations = allocations;
        this.overlapConflicts = overlapConflicts;
    }

    @GetMapping
    public List<AllocationDtos.AllocationResponse> list(
            @RequestParam(value = "flight_id", required = false) String flightId,
            @RequestParam(value = "resource_type", required = false) String resourceType
    ) {
        String tenantId = TenantContext.getTenantId();
        // v0: ignore filters for now; can be added cheaply later
        return allocations.findByTenantIdOrderByStartTimeDesc(tenantId).stream()
                .map(AllocationController::toDto)
                .toList();
    }

    @PostMapping
    public AllocationDtos.AllocationResponse create(@RequestBody AllocationDtos.AllocateRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (isBlank(req.flight_id())) throw new IllegalArgumentException("flight_id is required");
        if (isBlank(req.resource_type())) throw new IllegalArgumentException("resource_type is required");
        if (isBlank(req.resource_id())) throw new IllegalArgumentException("resource_id is required");
        if (isBlank(req.start_time()) || isBlank(req.end_time())) throw new IllegalArgumentException("start_time and end_time are required");

        Instant start = parseInstant(req.start_time(), "start_time");
        Instant end = parseInstant(req.end_time(), "end_time");
        if (!end.isAfter(start)) throw new IllegalArgumentException("end_time must be after start_time");

        AllocationEntity e = new AllocationEntity();
        e.setTenantId(TenantContext.getTenantId());
        e.setFlightId(req.flight_id());
        e.setResourceType(req.resource_type());
        e.setResourceId(req.resource_id());
        e.setStartTime(start);
        e.setEndTime(end);
        e.setStatus("PLANNED");
        e.setAllocationMode("MANUAL");
        e.setNotes(req.notes());

        AllocationEntity saved = allocations.save(e);
        overlapConflicts.syncForResource(saved.getTenantId(), saved.getResourceType(), saved.getResourceId());
        return toDto(saved);
    }

    @PostMapping("/{id}/release")
    public AllocationDtos.ReleaseResponse release(@PathVariable("id") String id) {
        UUID allocationId = parseUuid(id, "allocation id");
        String tenantId = TenantContext.getTenantId();
        AllocationEntity e = allocations.findByAllocationIdAndTenantId(allocationId, tenantId)
                .orElseThrow(() -> new NotFoundException("Allocation not found"));
        String rt = e.getResourceType();
        String rid = e.getResourceId();
        e.setStatus("RELEASED");
        allocations.save(e);
        overlapConflicts.syncForResource(tenantId, rt, rid);
        return new AllocationDtos.ReleaseResponse("released");
    }

    @PostMapping("/{id}/reallocate")
    public AllocationDtos.AllocationResponse reallocate(
            @PathVariable("id") String id,
            @RequestBody AllocationDtos.ReallocateRequest req
    ) {
        if (req == null || isBlank(req.resource_id())) {
            throw new IllegalArgumentException("resource_id is required");
        }
        UUID allocationId = parseUuid(id, "allocation id");
        String tenantId = TenantContext.getTenantId();
        AllocationEntity e = allocations.findByAllocationIdAndTenantId(allocationId, tenantId)
                .orElseThrow(() -> new NotFoundException("Allocation not found"));
        if ("RELEASED".equalsIgnoreCase(e.getStatus()) || "CANCELLED".equalsIgnoreCase(e.getStatus())) {
            throw new IllegalArgumentException("Cannot reallocate a released or cancelled allocation");
        }
        String prevRt = e.getResourceType();
        String prevRid = e.getResourceId();
        e.setResourceId(req.resource_id());
        if (req.reason() != null && !req.reason().isBlank()) {
            String note = e.getNotes() == null || e.getNotes().isBlank()
                    ? "[reallocate] " + req.reason()
                    : e.getNotes() + " | [reallocate] " + req.reason();
            e.setNotes(note);
        }
        AllocationEntity saved = allocations.save(e);
        overlapConflicts.syncForResource(tenantId, saved.getResourceType(), saved.getResourceId());
        if (!prevRid.equals(saved.getResourceId()) || !prevRt.equals(saved.getResourceType())) {
            overlapConflicts.syncForResource(tenantId, prevRt, prevRid);
        }
        return toDto(saved);
    }

    /**
     * Remove a terminal allocation from the database (e.g. after release). Active allocations must not be deleted here.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") String id) {
        UUID allocationId = parseUuid(id, "allocation id");
        String tenantId = TenantContext.getTenantId();
        AllocationEntity e = allocations.findByAllocationIdAndTenantId(allocationId, tenantId)
                .orElseThrow(() -> new NotFoundException("Allocation not found"));
        String st = e.getStatus();
        if (st == null || (!"RELEASED".equalsIgnoreCase(st) && !"CANCELLED".equalsIgnoreCase(st))) {
            throw new IllegalArgumentException("Only RELEASED or CANCELLED allocations can be deleted");
        }
        String rt = e.getResourceType();
        String rid = e.getResourceId();
        allocations.delete(e);
        overlapConflicts.syncForResource(tenantId, rt, rid);
    }

    private static AllocationDtos.AllocationResponse toDto(AllocationEntity a) {
        return new AllocationDtos.AllocationResponse(
                a.getAllocationId().toString(),
                a.getTenantId(),
                a.getFlightId(),
                a.getResourceType(),
                a.getResourceId(),
                a.getStartTime().toString(),
                a.getEndTime().toString(),
                a.getStatus(),
                a.getAllocationMode(),
                a.getNotes(),
                a.getCreatedAt().toString(),
                a.getUpdatedAt().toString()
        );
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static Instant parseInstant(String iso, String field) {
        try {
            return Instant.parse(iso);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(field + " must be ISO-8601 (e.g. 2026-03-12T10:00:00Z)");
        }
    }

    private static UUID parseUuid(String raw, String label) {
        try {
            return UUID.fromString(raw);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid " + label);
        }
    }
}

