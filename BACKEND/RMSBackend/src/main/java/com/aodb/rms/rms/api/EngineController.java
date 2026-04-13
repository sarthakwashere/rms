package com.aodb.rms.rms.api;

import com.aodb.rms.rms.api.dto.OtherDtos;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rms")
public class EngineController {
    @PostMapping("/run")
    public OtherDtos.RunAllocationResult run() {
        // v0 stub: wire in real rules/constraints engine later.
        return new OtherDtos.RunAllocationResult(0);
    }
}

