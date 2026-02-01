package com.inventory.saas.controller;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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
    public ResponseEntity<String> handleClerkWebhook(@RequestBody String payload) {
        try {
            System.out.println("\n--- CLERK WEBHOOK RECEIVED ---");
            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("type");
            JSONObject data = event.getJSONObject("data");

            String orgId = null;
            String planKey = null;

            System.out.println("Event Type: " + eventType);

            if (eventType.contains("subscription")) {
                if (data.has("payer")) {
                    orgId = data.getJSONObject("payer").optString("organization_id");
                }
                if (orgId == null || orgId.isEmpty()) {
                    orgId = data.optString("organization_id");
                }

                if (data.has("plan")) {
                    planKey = data.getJSONObject("plan").optString("slug");
                }
            }
            else if (eventType.startsWith("organization.")) {
                orgId = data.optString("id");
                if ("organization.created".equals(eventType)) {
                    planKey = "free";
                } else {
                    JSONObject meta = data.optJSONObject("public_metadata");
                    if (meta != null && meta.has("plan")) {
                        planKey = meta.getString("plan");
                    }
                }
            }

            System.out.println("Extracted OrgID: " + orgId);
            System.out.println("Extracted Plan: " + planKey);

            if (orgId != null && !orgId.isEmpty() && !"null".equals(orgId) && planKey != null) {
                assignPlan(orgId, planKey);
            } else {
                System.out.println("SKIPPED: Missing valid OrgID or PlanKey");
            }

            return ResponseEntity.ok("Webhook Handled");
        } catch (Exception e) {
            System.err.println("Webhook processing error: " + e.getMessage());
            return ResponseEntity.ok("Error acknowledged");
        }
    }

    private void assignPlan(String orgId, String planName) {
        String url = "https://api.clerk.com/v1/organizations/" + orgId + "/metadata";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(clerkSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        JSONObject body = new JSONObject();
        JSONObject meta = new JSONObject();
        meta.put("plan", planName.toLowerCase());
        body.put("public_metadata", meta);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            System.out.println("Sending PATCH to Clerk for Org: " + orgId);
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            System.out.println("SUCCESS: Metadata updated to " + planName);
        } catch (Exception e) {
            System.err.println("Clerk API Update Failed: " + e.getLocalizedMessage());
        }
    }
}