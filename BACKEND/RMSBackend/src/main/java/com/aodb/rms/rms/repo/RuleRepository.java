package com.aodb.rms.rms.repo;

import com.aodb.rms.rms.model.RuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RuleRepository extends JpaRepository<RuleEntity, UUID> {
    List<RuleEntity> findByTenantIdOrderByPriorityAsc(String tenantId);

    Optional<RuleEntity> findByRuleIdAndTenantId(UUID ruleId, String tenantId);
}

