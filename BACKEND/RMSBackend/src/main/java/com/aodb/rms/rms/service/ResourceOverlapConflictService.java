package com.aodb.rms.rms.service;

import com.aodb.rms.rms.model.AllocationEntity;
import com.aodb.rms.rms.model.ConflictEntity;
import com.aodb.rms.rms.repo.AllocationRepository;
import com.aodb.rms.rms.repo.ConflictRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Detects overlapping non-terminal allocations on the same resource and mirrors them as open conflicts.
 */
@Service
public class ResourceOverlapConflictService {

    public static final String CONFLICT_TYPE = "RESOURCE_OVERLAP";
    private static final String OPEN = "open";

    private final AllocationRepository allocations;
    private final ConflictRepository conflicts;

    public ResourceOverlapConflictService(AllocationRepository allocations, ConflictRepository conflicts) {
        this.allocations = allocations;
        this.conflicts = conflicts;
    }

    @Transactional
    public void syncForResource(String tenantId, String resourceType, String resourceId) {
        if (tenantId == null || resourceType == null || resourceId == null) {
            return;
        }
        conflicts.deleteByTenantIdAndConflictTypeAndResourceTypeAndResourceIdAndStatus(
                tenantId, CONFLICT_TYPE, resourceType, resourceId, OPEN);

        List<AllocationEntity> list = allocations
                .findByTenantIdAndResourceTypeAndResourceIdOrderByStartTimeAsc(tenantId, resourceType, resourceId)
                .stream()
                .filter(a -> isSchedulableStatus(a.getStatus()))
                .toList();

        for (int i = 0; i < list.size(); i++) {
            for (int j = i + 1; j < list.size(); j++) {
                AllocationEntity a = list.get(i);
                AllocationEntity b = list.get(j);
                if (intervalsOverlap(a, b)) {
                    ConflictEntity c = new ConflictEntity();
                    c.setTenantId(tenantId);
                    c.setConflictType(CONFLICT_TYPE);
                    c.setSeverity("critical");
                    c.setStatus(OPEN);
                    c.setResourceType(resourceType);
                    c.setResourceId(resourceId);
                    c.setConflictDescription(buildDescription(a, b, resourceType, resourceId));
                    conflicts.save(c);
                }
            }
        }
    }

    private static boolean isSchedulableStatus(String status) {
        if (status == null) {
            return false;
        }
        String s = status.trim().toUpperCase();
        return !"RELEASED".equals(s) && !"CANCELLED".equals(s);
    }

    private static boolean intervalsOverlap(AllocationEntity a, AllocationEntity b) {
        return a.getStartTime().isBefore(b.getEndTime()) && b.getStartTime().isBefore(a.getEndTime());
    }

    private static String buildDescription(
            AllocationEntity a,
            AllocationEntity b,
            String resourceType,
            String resourceId
    ) {
        return "Double booking on %s %s: two allocations overlap in time (flights %s and %s)."
                .formatted(resourceType, resourceId, shortFlight(a.getFlightId()), shortFlight(b.getFlightId()));
    }

    private static String shortFlight(String flightId) {
        if (flightId == null || flightId.isBlank()) {
            return "—";
        }
        return flightId.length() > 14 ? flightId.substring(0, 14) + "…" : flightId;
    }
}
