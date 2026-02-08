package com.inventory.saas.service;

import com.inventory.saas.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BillingGuard {

    private static final Logger logger = LoggerFactory.getLogger(BillingGuard.class);
    private final InventoryRepository inventoryRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    private final ConcurrentHashMap<String, String> memoryStorage = new ConcurrentHashMap<>();

    public record PlanLimits(int rateLimit, int skuLimit, int dailyReportLimit, int monthlyTokenLimit) {}

    public record UsageStats(long currentSkus, int skuLimit, int currentReports, int reportLimit, long currentTokens, int tokenLimit) {}

    public PlanLimits getLimits(String plan) {
        String normalizedPlan = (plan == null) ? "free" : plan.toLowerCase();

        if (normalizedPlan.contains("pro") || normalizedPlan.contains("test")) {
            return new PlanLimits(1000, 10000, 50, 500000);
        }

        return new PlanLimits(60, 5, 1, 15000);
    }

    public UsageStats getUsageStats(String tenantId, String plan) {
        PlanLimits limits = getLimits(plan);

        long skus = inventoryRepository.countByTenantId(tenantId);

        String reportKey = "usage:report:" + tenantId + ":" + LocalDate.now();
        String reportVal = getValue(reportKey);
        int reports = (reportVal != null) ? Integer.parseInt(reportVal) : 0;

        String tokenKey = "usage:tokens:" + tenantId;
        String tokenVal = getValue(tokenKey);
        long tokens = (tokenVal != null) ? Long.parseLong(tokenVal) : 0;

        return new UsageStats(skus, limits.skuLimit(), reports, limits.dailyReportLimit(), tokens, limits.monthlyTokenLimit());
    }

    private String getValue(String key) {
        if (redisTemplate != null) {
            try {
                return redisTemplate.opsForValue().get(key);
            } catch (Exception e) {
                logger.warn("Redis not available, using memory fallback for key: {}", key);
            }
        }
        return memoryStorage.get(key);
    }

    private void setValue(String key, String value) {
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(key, value);
                return;
            } catch (Exception e) {
                logger.warn("Redis not available, using memory fallback for key: {}", key);
            }
        }
        memoryStorage.put(key, value);
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
        String current = getValue(key);
        int limit = getLimits(plan).dailyReportLimit();

        if (current != null && Integer.parseInt(current) >= limit) {
            logger.warn("Report Limit Blocked: Tenant {} reached daily limit of {}", tenantId, limit);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily PDF report limit reached for the " + plan + " plan.");
        }

        String currentValue = getValue(key);
        int newValue = (currentValue != null) ? Integer.parseInt(currentValue) + 1 : 1;
        setValue(key, String.valueOf(newValue));
    }

    public void validateTokenBudget(String tenantId, String plan) {
        String key = "usage:tokens:" + tenantId;
        String current = getValue(key);
        int limit = getLimits(plan).monthlyTokenLimit();

        if (current != null && Long.parseLong(current) >= limit) {
            logger.warn("AI Token Budget Blocked: Tenant {} exhausted {} tokens", tenantId, limit);
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "Monthly AI analysis budget exhausted. Upgrade to Pro for higher limits.");
        }
    }

    public void updateTokenUsage(String tenantId, long tokensUsed) {
        String key = "usage:tokens:" + tenantId;
        String currentValue = getValue(key);
        long newValue = (currentValue != null) ? Long.parseLong(currentValue) + tokensUsed : tokensUsed;
        setValue(key, String.valueOf(newValue));
    }
}