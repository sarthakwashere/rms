-- Demo UI previously logged in with tenant_id = 'rms-review-tenant' while seed/rules
-- use 'default'. Reattach historical rows so they show under the default tenant.

UPDATE allocations SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE conflicts SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE constraints SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE templates SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE simulations SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE rules SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
UPDATE audit_log SET tenant_id = 'default' WHERE tenant_id = 'rms-review-tenant';
