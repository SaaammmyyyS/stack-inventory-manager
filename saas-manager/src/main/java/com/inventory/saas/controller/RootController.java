package com.inventory.saas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> healthCheck() {
        return Map.of(
                "status", "UP",
                "message", "SaaS Manager API is operational",
                "environment", "Production"
        );
    }
}