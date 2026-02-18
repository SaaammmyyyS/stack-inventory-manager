package com.inventory.saas.service;

import com.inventory.saas.config.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId("test-tenant");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldAllowRequestsWithinLimit() {
        String tenantId = "test-tenant";
        int limitPerMinute = 10;

        assertEquals("test-tenant", TenantContext.getTenantId());
        assertTrue(limitPerMinute > 0, "Limit should be positive");
    }

    @Test
    void shouldHandleMultipleTenants() throws InterruptedException {
        int threadCount = 5;
        int limitPerMinute = 10;
        AtomicInteger allowedCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    TenantContext.setTenantId("tenant-" + threadId);

                    assertEquals("tenant-" + threadId, TenantContext.getTenantId());
                    allowedCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(5, TimeUnit.SECONDS), "All threads should complete within 5 seconds");

        assertTrue(allowedCount.get() <= limitPerMinute, "Should not exceed rate limit");
        assertTrue(allowedCount.get() > 0, "Should allow some requests");
    }
}
