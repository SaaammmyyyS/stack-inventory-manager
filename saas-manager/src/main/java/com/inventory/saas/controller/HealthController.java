package com.inventory.saas.controller;

import com.inventory.saas.ai.service.OllamaHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    private final OllamaHealthService ollamaHealthService;

    @GetMapping("/ai")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER', 'USER')")
    public ResponseEntity<Map<String, Object>> getAiHealth() {
        String ollamaStatus = ollamaHealthService.getOllamaStatus();
        boolean isHealthy = "HEALTHY".equals(ollamaStatus);
        
        Map<String, Object> response = Map.of(
            "status", isHealthy ? "UP" : "DOWN",
            "ollama", ollamaStatus,
            "timestamp", System.currentTimeMillis()
        );
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/ai/clear-cache")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Map<String, String>> clearAiHealthCache() {
        ollamaHealthService.clearHealthCache();
        return ResponseEntity.ok(Map.of("message", "AI health cache cleared"));
    }
}
