package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.SimulationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SimulationRepository extends JpaRepository<SimulationEntity, UUID> {
    List<SimulationEntity> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<SimulationEntity> findBySimulationIdAndTenantId(UUID simulationId, String tenantId);
}

