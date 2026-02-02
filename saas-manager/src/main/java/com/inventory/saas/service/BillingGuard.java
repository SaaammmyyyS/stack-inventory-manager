package com.inventory.saas.service;

import com.inventory.saas.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BillingGuard {

    private final InventoryRepository inventoryRepository;
    private final StringRedisTemplate redisTemplate;

    public record PlanLimits(int rateLimit, int skuLimit, int dailyReportLimit, int monthlyTokenLimit) {}

    public PlanLimits getLimits(String plan) {
        String normalizedPlan = (plan == null) ? "free" : plan.toLowerCase();

        if (normalizedPlan.contains("pro") || normalizedPlan.contains("test")) {
            return new PlanLimits(1000, 10000, 50, 500000);
        }

        return new PlanLimits(60, 50, 1, 15000);
    }

    public void validateSkuLimit(String tenantId, String plan) {
        if (inventoryRepository.countByTenantId(tenantId) >= getLimits(plan).skuLimit()) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "SKU Limit reached for your current plan.");
        }
    }

    public void validateReportLimit(String tenantId, String plan) {
        String key = "usage:report:" + tenantId + ":" + LocalDate.now();
        String current = redisTemplate.opsForValue().get(key);

        if (current != null && Integer.parseInt(current) >= getLimits(plan).dailyReportLimit()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Daily PDF report limit reached.");
        }
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 25, TimeUnit.HOURS);
    }

    public void validateTokenBudget(String tenantId, String plan) {
        String key = "usage:tokens:" + tenantId;
        String current = redisTemplate.opsForValue().get(key);

        if (current != null && Long.parseLong(current) >= getLimits(plan).monthlyTokenLimit()) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Monthly AI token budget exhausted.");
        }
    }

    public void updateTokenUsage(String tenantId, long tokensUsed) {
        String key = "usage:tokens:" + tenantId;
        redisTemplate.opsForValue().increment(key, tokensUsed);
        if (redisTemplate.getExpire(key) == -1) {
            redisTemplate.expire(key, 31, TimeUnit.DAYS);
        }
    }
}