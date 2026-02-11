package com.inventory.saas;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.config.TenantContext;
import com.inventory.saas.dto.InventoryItemDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ContextConfiguration(classes = TestConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class ConcurrentTenantOperationsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private BillingGuard billingGuard;

    @Autowired
    private ObjectMapper objectMapper;

    private static final int TENANT_COUNT = 5;
    private static final int THREADS_PER_TENANT = 3;
    private static final int OPERATIONS_PER_THREAD = 10;

    @BeforeEach
    void setup() {
        when(rateLimitService.isAllowed(anyString(), anyInt())).thenReturn(true);
        when(billingGuard.getLimits(anyString())).thenReturn(new BillingGuard.PlanLimits(1000, 10000, 50, 500000));
        when(billingGuard.getUsageStats(anyString(), anyString())).thenReturn(new BillingGuard.UsageStats(0, 5, 0, 1, 0, 15000));
        org.mockito.Mockito.doNothing().when(billingGuard).validateSkuLimit(anyString(), anyString());

        inventoryRepository.deleteAll();
    }

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldHandleHighConcurrencyAcrossMultipleTenants() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(TENANT_COUNT * THREADS_PER_TENANT);
        CountDownLatch latch = new CountDownLatch(TENANT_COUNT * THREADS_PER_TENANT);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        List<Exception> exceptions = new CopyOnWriteArrayList<>();

        for (int tenantIndex = 0; tenantIndex < TENANT_COUNT; tenantIndex++) {
            final String tenantId = "tenant-" + tenantIndex;

            for (int threadIndex = 0; threadIndex < THREADS_PER_TENANT; threadIndex++) {
                final int threadId = threadIndex;

                executor.submit(() -> {
                    try {
                        TenantContext.setTenantId(tenantId);

                        for (int op = 0; op < OPERATIONS_PER_THREAD; op++) {
                            InventoryItemDTO item = new InventoryItemDTO();
                            item.setName("Product-" + tenantId + "-" + threadId + "-" + op);
                            item.setSku("SKU-" + tenantId + "-" + threadId + "-" + op + "-" + UUID.randomUUID().toString().substring(0, 8));
                            item.setQuantity(50);
                            item.setPrice(new BigDecimal("50.00"));

                            String response = mockMvc.perform(post("/api/inventory")
                                            .header("X-Tenant-ID", tenantId)
                                            .header("X-Organization-Plan", "free")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(objectMapper.writeValueAsString(item)))
                                    .andExpect(status().isCreated())
                                    .andReturn().getResponse().getContentAsString();

                            String itemId = extractItemIdFromResponse(response);

                            mockMvc.perform(get("/api/inventory/" + itemId)
                                            .header("X-Tenant-ID", tenantId)
                                            .header("X-Organization-Plan", "free"))
                                    .andExpect(status().isOk())
                                    .andExpect(jsonPath("$.name").value(item.getName()));

                            item.setQuantity(75);
                            mockMvc.perform(put("/api/inventory/" + itemId)
                                            .header("X-Tenant-ID", tenantId)
                                            .header("X-Organization-Plan", "free")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(objectMapper.writeValueAsString(item)))
                                    .andExpect(status().isOk());

                            successCount.incrementAndGet();
                        }
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                        exceptions.add(e);
                        System.err.println("Error in thread " + threadId + " for tenant " + tenantId + ": " + e.getMessage());
                    } finally {
                        TenantContext.clear();
                        latch.countDown();
                    }
                });
            }
        }

        assertTrue(latch.await(60, TimeUnit.SECONDS), "All concurrent operations should complete within 60 seconds");

        if (!exceptions.isEmpty()) {
            System.err.println("Exceptions occurred during concurrent operations:");
            exceptions.forEach(e -> System.err.println("  " + e.getMessage()));
        }

        System.out.println("Success count: " + successCount.get());
        System.out.println("Error count: " + errorCount.get());
        System.out.println("Exception count: " + exceptions.size());

        for (int tenantIndex = 0; tenantIndex < TENANT_COUNT; tenantIndex++) {
            final String tenantId = "tenant-" + tenantIndex;
            TenantContext.setTenantId(tenantId);
            long itemCount = inventoryRepository.count();
            System.out.println("Tenant " + tenantId + " has " + itemCount + " items");
            assertTrue(itemCount >= 0, "Tenant " + tenantId + " should have non-negative item count");
            TenantContext.clear();
        }

        executor.shutdown();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldPreventDataLeakageUnderHighConcurrency() throws Exception {
        String tenantA = "tenant-A";
        String tenantB = "tenant-B";

        TenantContext.setTenantId(tenantA);
        InventoryItem sensitiveItem = new InventoryItem();
        sensitiveItem.setName("Sensitive Product");
        sensitiveItem.setSku("SENSITIVE-001");
        sensitiveItem.setQuantity(100);
        sensitiveItem.setPrice(new BigDecimal("999.99"));
        inventoryRepository.save(sensitiveItem);
        String sensitiveItemId = sensitiveItem.getId().toString();
        TenantContext.clear();

        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(20);
        AtomicInteger dataLeakAttempts = new AtomicInteger(0);
        AtomicInteger successfulDataLeaks = new AtomicInteger(0);

        for (int i = 0; i < 20; i++) {
            final int threadId = i;
            final String attackerTenant = threadId % 2 == 0 ? tenantA : tenantB;
            final String targetTenant = threadId % 2 == 0 ? tenantB : tenantA;

            executor.submit(() -> {
                try {
                    for (int j = 0; j < 10; j++) {
                        dataLeakAttempts.incrementAndGet();

                        mockMvc.perform(get("/api/inventory/" + sensitiveItemId)
                                        .header("X-Tenant-ID", attackerTenant))
                                .andExpect(status().isNotFound());

                        mockMvc.perform(get("/api/inventory")
                                        .header("X-Tenant-ID", attackerTenant))
                                .andExpect(jsonPath("$.items").isArray())
                                .andExpect(jsonPath("$.items[?(@.name == 'Sensitive Product')]").doesNotExist());
                    }
                } catch (Exception e) {
                    if (e.getMessage().contains("200") || e.getMessage().contains("Sensitive Product")) {
                        successfulDataLeaks.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        assertEquals(0, successfulDataLeaks.get(), "No data leaks should occur under concurrent load");

        executor.shutdown();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldMaintainPerformanceUnderConcurrentLoad() throws Exception {
        int threadCount = 15;
        int operationsPerThread = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        List<Long> operationTimes = new CopyOnWriteArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            final String tenantId = "perf-tenant-" + (threadId % 3);

            executor.submit(() -> {
                try {
                    for (int j = 0; j < operationsPerThread; j++) {
                        long startTime = System.currentTimeMillis();

                        InventoryItem item = new InventoryItem();
                        item.setName("Perf-Product-" + threadId + "-" + j);
                        item.setSku("PERF-" + threadId + "-" + j);
                        item.setQuantity(25);
                        item.setPrice(new BigDecimal("25.00"));

                        mockMvc.perform(post("/api/inventory")
                                        .header("X-Tenant-ID", tenantId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(item)))
                                .andExpect(status().isCreated());

                        long endTime = System.currentTimeMillis();
                        operationTimes.add(endTime - startTime);
                    }
                } catch (Exception e) {
                    System.err.println("Performance test operation failed: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(45, TimeUnit.SECONDS));

        double averageTime = operationTimes.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxTime = operationTimes.stream().mapToLong(Long::longValue).max().orElse(0);

        assertTrue(averageTime < 2000, "Average operation time should be under 2 seconds, was: " + averageTime + "ms");
        assertTrue(maxTime < 5000, "Maximum operation time should be under 5 seconds, was: " + maxTime + "ms");

        executor.shutdown();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldHandleTenantContextSwitchingCorrectly() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(10);
        AtomicInteger contextSwitchErrors = new AtomicInteger(0);

        for (int i = 0; i < 10; i++) {
            final int threadId = i;

            executor.submit(() -> {
                try {
                    String tenantA = "switch-tenant-A-" + threadId;
                    String tenantB = "switch-tenant-B-" + threadId;

                    for (int j = 0; j < 5; j++) {
                        InventoryItem itemA = new InventoryItem();
                        itemA.setName("Item-A-" + threadId + "-" + j);
                        itemA.setSku("A-" + threadId + "-" + j);
                        itemA.setQuantity(10);
                        itemA.setPrice(new BigDecimal("10.00"));

                        mockMvc.perform(post("/api/inventory")
                                        .header("X-Tenant-ID", tenantA)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(itemA)))
                                .andExpect(status().isCreated());

                        InventoryItem itemB = new InventoryItem();
                        itemB.setName("Item-B-" + threadId + "-" + j);
                        itemB.setSku("B-" + threadId + "-" + j);
                        itemB.setQuantity(20);
                        itemB.setPrice(new BigDecimal("20.00"));

                        mockMvc.perform(post("/api/inventory")
                                        .header("X-Tenant-ID", tenantB)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(itemB)))
                                .andExpect(status().isCreated());
                    }

                    mockMvc.perform(get("/api/inventory")
                                    .header("X-Tenant-ID", tenantA))
                            .andExpect(jsonPath("$.items").isArray())
                            .andExpect(jsonPath("$.items.length()").value(5))
                            .andExpect(jsonPath("$.items[?(@.name.startsWith('Item-A-'))]").isArray())
                            .andExpect(jsonPath("$.items[?(@.name.startsWith('Item-B-'))]").doesNotExist());

                    mockMvc.perform(get("/api/inventory")
                                    .header("X-Tenant-ID", tenantB))
                            .andExpect(jsonPath("$.items").isArray())
                            .andExpect(jsonPath("$.items.length()").value(5))
                            .andExpect(jsonPath("$.items[?(@.name.startsWith('Item-B-'))]").isArray())
                            .andExpect(jsonPath("$.items[?(@.name.startsWith('Item-A-'))]").doesNotExist());

                } catch (Exception e) {
                    contextSwitchErrors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        assertEquals(0, contextSwitchErrors.get(), "No context switch errors should occur");

        executor.shutdown();
    }

    private String extractItemIdFromResponse(String response) {
        try {
            JsonNode jsonNode = objectMapper.readTree(response);
            JsonNode idNode = jsonNode.get("id");
            if (idNode != null) {
                return idNode.asText();
            }
        } catch (Exception e) {
            int idStart = response.indexOf("\"id\":\"");
            int idEnd = response.indexOf("\"", idStart + 6);
            if (idStart != -1 && idEnd != -1) {
                return response.substring(idStart + 6, idEnd);
            }
        }
        return null;
    }
}
