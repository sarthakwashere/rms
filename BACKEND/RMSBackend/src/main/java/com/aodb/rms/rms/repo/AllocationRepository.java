package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.AllocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AllocationRepository extends JpaRepository<AllocationEntity, UUID> {
    List<AllocationEntity> findByTenantIdOrderByStartTimeDesc(String tenantId);

    Optional<AllocationEntity> findByAllocationIdAndTenantId(UUID allocationId, String tenantId);

    List<AllocationEntity> findByTenantIdAndResourceTypeAndResourceIdOrderByStartTimeAsc(
            String tenantId,
            String resourceType,
            String resourceId
    );
}

