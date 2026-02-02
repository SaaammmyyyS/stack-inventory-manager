package com.inventory.saas.service;

import com.inventory.saas.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BillingGuard {

    private static final Logger logger = LoggerFactory.getLogger(BillingGuard.class);
    private final InventoryRepository inventoryRepository;
    private final StringRedisTemplate redisTemplate;

    public record PlanLimits(int rateLimit, int skuLimit, int dailyReportLimit, int monthlyTokenLimit) {}

    public PlanLimits getLimits(String plan) {
        String normalizedPlan = (plan == null) ? "free" : plan.toLowerCase();

        if (normalizedPlan.contains("pro") || normalizedPlan.contains("enterprise")) {
            return new PlanLimits(1000, 10000, 50, 500000);
        }

        return new PlanLimits(60, 50, 1, 15000);
    }

    public void validateSkuLimit(String tenantId, String plan) {
        long currentSkus = inventoryRepository.countByTenantId(tenantId);
        int limit = getLimits(plan).skuLimit();

        if (currentSkus >= limit) {
            logger.warn("SKU Limit Blocked: Tenant {} (Plan: {}) has {}/{} SKUs", tenantId, plan, currentSkus, limit);
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "SKU Limit reached (" + limit + "). Please upgrade your plan to add more items.");
        }
    }

    public void validateReportLimit(String tenantId, String plan) {
        String key = "usage:report:" + tenantId + ":" + LocalDate.now();
        String current = redisTemplate.opsForValue().get(key);
        int limit = getLimits(plan).dailyReportLimit();

        if (current != null && Integer.parseInt(current) >= limit) {
            logger.warn("Report Limit Blocked: Tenant {} reached daily limit of {}", tenantId, limit);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily PDF report limit reached for the " + plan + " plan.");
        }

        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 25, TimeUnit.HOURS);
    }

    public void validateTokenBudget(String tenantId, String plan) {
        String key = "usage:tokens:" + tenantId;
        String current = redisTemplate.opsForValue().get(key);
        int limit = getLimits(plan).monthlyTokenLimit();

        if (current != null && Long.parseLong(current) >= limit) {
            logger.warn("AI Token Budget Blocked: Tenant {} exhausted {} tokens", tenantId, limit);
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "Monthly AI analysis budget exhausted. Upgrade to Pro for higher limits.");
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