package com.aodb.rms.rms.api;

import com.aodb.rms.tenant.TenantContext;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record LoginRequest(String username, String password) {}

    public record LoginUser(
            String display_name,
            String first_name,
            String email,
            String role
    ) {}

    public record LoginResponse(
            String access_token,
            String token_type,
            int expires_in,
            String tenant_id,
            String user_id,
            LoginUser user
    ) {}

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        String username = req == null || req.username() == null || req.username().isBlank() ? "rms" : req.username();
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) tenantId = "default";

        return new LoginResponse(
                "rms-dev-token",
                "Bearer",
                3600,
                tenantId,
                "rms-dev-user",
                new LoginUser(
                        "RMS Operator",
                        "RMS",
                        username + "@local",
                        "admin"
                )
        );
    }
}

