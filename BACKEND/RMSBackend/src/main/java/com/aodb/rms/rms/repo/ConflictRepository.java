package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.ConflictEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConflictRepository extends JpaRepository<ConflictEntity, UUID> {
    List<ConflictEntity> findByTenantIdOrderByDetectedAtDesc(String tenantId);

    long deleteByTenantIdAndConflictTypeAndResourceTypeAndResourceIdAndStatus(
            String tenantId,
            String conflictType,
            String resourceType,
            String resourceId,
            String status
    );
}

