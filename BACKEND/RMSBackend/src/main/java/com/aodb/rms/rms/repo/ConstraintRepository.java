package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.ConstraintEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConstraintRepository extends JpaRepository<ConstraintEntity, UUID> {
    List<ConstraintEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<ConstraintEntity> findByConstraintIdAndTenantId(UUID constraintId, String tenantId);
}

