package com.inventory.saas.service;

import com.inventory.saas.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BillingGuardTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private BillingGuard billingGuard;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        ReflectionTestUtils.setField(billingGuard, "redisTemplate", redisTemplate);
    }

    @Test
    void shouldReturnCorrectLimitsForProPlan() {
        BillingGuard.PlanLimits limits = billingGuard.getLimits("pro");

        assertEquals(1000, limits.rateLimit());
        assertEquals(10000, limits.skuLimit());
        assertEquals(50, limits.dailyReportLimit());
        assertEquals(500000, limits.monthlyTokenLimit());
    }

    @Test
    void shouldReturnCorrectLimitsForTestPlan() {
        BillingGuard.PlanLimits limits = billingGuard.getLimits("test");

        assertEquals(1000, limits.rateLimit());
        assertEquals(10000, limits.skuLimit());
        assertEquals(50, limits.dailyReportLimit());
        assertEquals(500000, limits.monthlyTokenLimit());
    }

    @Test
    void shouldReturnCorrectLimitsForFreePlan() {
        BillingGuard.PlanLimits limits = billingGuard.getLimits("free");

        assertEquals(60, limits.rateLimit());
        assertEquals(5, limits.skuLimit());
        assertEquals(1, limits.dailyReportLimit());
        assertEquals(15000, limits.monthlyTokenLimit());
    }

    @Test
    void shouldReturnCorrectLimitsForNullPlan() {
        BillingGuard.PlanLimits limits = billingGuard.getLimits(null);

        assertEquals(60, limits.rateLimit());
        assertEquals(5, limits.skuLimit());
        assertEquals(1, limits.dailyReportLimit());
        assertEquals(15000, limits.monthlyTokenLimit());
    }

    @Test
    void shouldHandleCaseInsensitivePlanNames() {
        BillingGuard.PlanLimits proLimits = billingGuard.getLimits("PRO");
        BillingGuard.PlanLimits testLimits = billingGuard.getLimits("Test");

        assertEquals(10000, proLimits.skuLimit());
        assertEquals(10000, testLimits.skuLimit());
    }

    @Test
    void shouldGetUsageStatsWithRedis() {
        String tenantId = "tenant-123";
        String plan = "pro";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(10L);
        when(valueOperations.get("usage:report:" + tenantId + ":" + LocalDate.now())).thenReturn("5");
        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn("1000");

        BillingGuard.UsageStats stats = billingGuard.getUsageStats(tenantId, plan);

        assertEquals(10, stats.currentSkus());
        assertEquals(10000, stats.skuLimit());
        assertEquals(5, stats.currentReports());
        assertEquals(50, stats.reportLimit());
        assertEquals(1000, stats.currentTokens());
        assertEquals(500000, stats.tokenLimit());

        verify(valueOperations).get("usage:report:" + tenantId + ":" + LocalDate.now());
        verify(valueOperations).get("usage:tokens:" + tenantId);
    }

    @Test
    void shouldGetUsageStatsWithMemoryFallback() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(3L);
        when(valueOperations.get(anyString())).thenReturn(null);

        BillingGuard.UsageStats stats = billingGuard.getUsageStats(tenantId, plan);

        assertEquals(3, stats.currentSkus());
        assertEquals(5, stats.skuLimit());
        assertEquals(0, stats.currentReports());
        assertEquals(1, stats.reportLimit());
        assertEquals(0, stats.currentTokens());
        assertEquals(15000, stats.tokenLimit());
    }

    @Test
    void shouldValidateSkuLimitWhenUnderLimit() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(3L);

        assertDoesNotThrow(() -> billingGuard.validateSkuLimit(tenantId, plan));
    }

    @Test
    void shouldThrowExceptionWhenSkuLimitExceeded() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(5L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> billingGuard.validateSkuLimit(tenantId, plan));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("SKU Limit reached"));
    }

    @Test
    void shouldValidateReportLimitWhenUnderLimit() {
        String tenantId = "tenant-123";
        String plan = "pro";

        when(valueOperations.get("usage:report:" + tenantId + ":" + LocalDate.now())).thenReturn("25");

        assertDoesNotThrow(() -> billingGuard.validateReportLimit(tenantId, plan));

        verify(valueOperations).set(eq("usage:report:" + tenantId + ":" + LocalDate.now()), eq("26"));
    }

    @Test
    void shouldThrowExceptionWhenReportLimitExceeded() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(valueOperations.get("usage:report:" + tenantId + ":" + LocalDate.now())).thenReturn("2");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> billingGuard.validateReportLimit(tenantId, plan));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("Daily PDF report limit reached"));
    }

    @Test
    void shouldValidateTokenBudgetWhenUnderLimit() {
        String tenantId = "tenant-123";
        String plan = "pro";

        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn("100000");

        assertDoesNotThrow(() -> billingGuard.validateTokenBudget(tenantId, plan));
    }

    @Test
    void shouldThrowExceptionWhenTokenBudgetExceeded() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn("15001");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> billingGuard.validateTokenBudget(tenantId, plan));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("Monthly AI analysis budget exhausted"));
    }

    @Test
    void shouldUpdateTokenUsage() {
        String tenantId = "tenant-123";
        long tokensUsed = 500;

        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn("1000");

        billingGuard.updateTokenUsage(tenantId, tokensUsed);

        verify(valueOperations).set("usage:tokens:" + tenantId, "1500");
    }

    @Test
    void shouldUpdateTokenUsageFromZero() {
        String tenantId = "tenant-123";
        long tokensUsed = 500;

        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn(null);

        billingGuard.updateTokenUsage(tenantId, tokensUsed);

        verify(valueOperations).set("usage:tokens:" + tenantId, "500");
    }

    @Test
    void shouldFallbackToMemoryWhenRedisFails() {
        String tenantId = "tenant-123";
        String plan = "free";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(2L);
        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis unavailable"));

        assertDoesNotThrow(() -> billingGuard.getUsageStats(tenantId, plan));

        BillingGuard.UsageStats stats = billingGuard.getUsageStats(tenantId, plan);
        assertEquals(2, stats.currentSkus());
    }

    @Test
    void shouldHandleRedisExceptionInSetValue() {
        String tenantId = "tenant-123";

        when(valueOperations.get("usage:report:" + tenantId + ":" + LocalDate.now())).thenReturn("0");
        doThrow(new RuntimeException("Redis write failed")).when(valueOperations).set(anyString(), anyString());

        assertDoesNotThrow(() -> billingGuard.validateReportLimit(tenantId, "pro"));
    }

    @Test
    void shouldHandleNullRedisTemplate() {
        BillingGuard billingGuardWithoutRedis = new BillingGuard(inventoryRepository);
        String tenantId = "tenant-123";
        String plan = "free";

        when(inventoryRepository.countByTenantId(tenantId)).thenReturn(2L);

        assertDoesNotThrow(() -> billingGuardWithoutRedis.getUsageStats(tenantId, plan));

        BillingGuard.UsageStats stats = billingGuardWithoutRedis.getUsageStats(tenantId, plan);
        assertEquals(2, stats.currentSkus());
        assertEquals(0, stats.currentReports());
        assertEquals(0, stats.currentTokens());
    }

    @Test
    void shouldHandleConcurrentTokenUpdates() throws InterruptedException {
        String tenantId = "tenant-concurrent";
        int threadCount = 10;
        int tokensPerThread = 100;

        when(valueOperations.get("usage:tokens:" + tenantId)).thenReturn("0");

        Thread[] threads = new Thread[threadCount];
        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                billingGuard.updateTokenUsage(tenantId, tokensPerThread);
            });
        }

        for (Thread thread : threads) {
            thread.start();
        }

        for (Thread thread : threads) {
            thread.join(1000);
        }

        verify(valueOperations, atLeastOnce()).set(eq("usage:tokens:" + tenantId), anyString());
    }
}
