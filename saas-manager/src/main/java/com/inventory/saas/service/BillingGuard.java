package com.inventory.saas.service;

import com.inventory.saas.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class BillingGuard {

    private final InventoryRepository inventoryRepository;

    public void validateSkuLimit(String tenantId, String plan) {
        String normalizedPlan = (plan == null || plan.isEmpty()) ? "free" : plan.toLowerCase();

        if (normalizedPlan.contains("free")) {
            long currentCount = inventoryRepository.countByTenantId(tenantId);

            if (currentCount >= 50) {
                throw new ResponseStatusException(
                        HttpStatus.PAYMENT_REQUIRED,
                        "SKU Limit reached (50/50) for Free Tier. Please upgrade to the Test/Pro plan to add more items."
                );
            }
        }
    }
}