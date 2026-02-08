package com.inventory.saas.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
public class OllamaTestController {

    private final ChatClient simpleChatClient;

    public OllamaTestController(@Qualifier("simpleChatClient") ChatClient simpleChatClient) {
        this.simpleChatClient = simpleChatClient;
    }

    @PostMapping("/ollama-simple")
    public ResponseEntity<Map<String, String>> testOllamaSimple(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
            }

            long startTime = System.currentTimeMillis();
            
            String response = simpleChatClient.prompt()
                    .user(message)
                    .call()
                    .content();
            
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            return ResponseEntity.ok(Map.of(
                "response", response != null ? response : "No response",
                "duration_ms", String.valueOf(duration),
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getMessage(),
                "status", "error"
            ));
        }
    }
}
