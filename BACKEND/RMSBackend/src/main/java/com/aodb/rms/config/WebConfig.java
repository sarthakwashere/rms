package com.aodb.rms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Vite may use 3010, 3011, 5173, etc.; patterns avoid CORS breakage when the port shifts.
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        // Staging: UI and API on different ports (8443 vs 8444) are different browser origins.
                        "http://65.0.236.144:*",
                        "https://65.0.236.144:*",
                        // Production UI (default 443 / explicit port — some stacks omit :443 in Origin).
                        "http://rms.corepeelers.com",
                        "https://rms.corepeelers.com",
                        "http://rms.corepeelers.com:*",
                        "https://rms.corepeelers.com:*",
                        // Current production UI domain.
                        "http://rms.aerois.ai",
                        "https://rms.aerois.ai",
                        "http://rms.aerois.ai:*",
                        "https://rms.aerois.ai:*"
                )
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}

