package com.inventory.saas.controller;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    @Value("${CLERK_SECRET_KEY}")
    private String clerkSecretKey;

    private final RestTemplate restTemplate;

    @Autowired
    public WebhookController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp) {

        try {
            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("type");

            if ("organization.created".equals(eventType)) {
                JSONObject data = event.getJSONObject("data");
                String orgId = data.getString("id");

                System.out.println("Processing Webhook: New organization " + orgId);
                assignDefaultPlan(orgId);
            }

            return ResponseEntity.ok("Webhook Handled");
        } catch (Exception e) {
            System.err.println("Webhook Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error");
        }
    }

    private void assignDefaultPlan(String orgId) {
        String url = "https://api.clerk.com/v1/organizations/" + orgId + "/metadata";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(clerkSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        JSONObject publicMetadata = new JSONObject();
        publicMetadata.put("plan", "free");

        JSONObject body = new JSONObject();
        body.put("public_metadata", publicMetadata);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            System.out.println("Plan 'free' successfully assigned to " + orgId);
        } catch (Exception e) {
            System.err.println("Failed to update Clerk: " + e.getMessage());
        }
    }
}