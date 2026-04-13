package com.aodb.rms.tenant;

public final class TenantContext {
    private static final ThreadLocal<String> TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(String tenantId) {
        TENANT.set(tenantId);
    }

    public static String getTenantId() {
        String v = TENANT.get();
        return (v == null || v.isBlank()) ? "default" : v;
    }

    public static void clear() {
        TENANT.remove();
    }
}

