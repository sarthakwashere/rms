package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.TemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TemplateRepository extends JpaRepository<TemplateEntity, UUID> {
    List<TemplateEntity> findByTenantIdOrderByUpdatedAtDesc(String tenantId);

    Optional<TemplateEntity> findByTemplateIdAndTenantId(UUID templateId, String tenantId);
}

