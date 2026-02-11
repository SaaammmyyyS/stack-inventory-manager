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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ContextConfiguration(classes = TestConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class MultiTenantDataIsolationTest {

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

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final String TENANT_C = "tenant-c";

    @BeforeEach
    void setup() {
        when(rateLimitService.isAllowed(anyString(), anyInt())).thenReturn(true);
        when(billingGuard.getLimits(anyString())).thenReturn(new BillingGuard.PlanLimits(1000, 10000, 50, 500000));
        when(billingGuard.getUsageStats(anyString(), anyString())).thenReturn(new BillingGuard.UsageStats(0, 5, 0, 1, 0, 15000));
        org.mockito.Mockito.doNothing().when(billingGuard).validateSkuLimit(anyString(), anyString());

        inventoryRepository.deleteAll();

        setupTenantData(TENANT_A, "Product-A", "SKU-A-001");
        setupTenantData(TENANT_B, "Product-B", "SKU-B-001");
        setupTenantData(TENANT_C, "Product-C", "SKU-C-001");
    }

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    private void setupTenantData(String tenantId, String productName, String sku) {
        TenantContext.setTenantId(tenantId);

        InventoryItemDTO item = new InventoryItemDTO();
        item.setName(productName);
        item.setSku(sku);
        item.setQuantity(100);
        item.setPrice(new BigDecimal("99.99"));
        inventoryRepository.save(convertToEntity(item));

        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldIsolateDataBetweenTenants() throws Exception {
        mockMvc.perform(get("/api/inventory")
                        .header("X-Tenant-ID", TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Product-A"))
                .andExpect(jsonPath("$.total").value(1));

        mockMvc.perform(get("/api/inventory")
                        .header("X-Tenant-ID", TENANT_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Product-B"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldPreventCrossTenantDataAccess() throws Exception {
        TenantContext.setTenantId(TENANT_A);
        String tenantAItemId = inventoryRepository.findAll().get(0).getId().toString();
        TenantContext.clear();

        mockMvc.perform(get("/api/inventory/" + tenantAItemId)
                        .header("X-Tenant-ID", TENANT_B))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/inventory/" + tenantAItemId)
                        .header("X-Tenant-ID", TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Product-A"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldPreventCrossTenantDataModification() throws Exception {
        TenantContext.setTenantId(TENANT_A);
        UUID tenantAItemId = inventoryRepository.findAll().get(0).getId();
        TenantContext.clear();

        InventoryItemDTO updateRequest = new InventoryItemDTO();
        updateRequest.setName("Hacked Product");
        updateRequest.setSku("HACKED-SKU");
        updateRequest.setQuantity(999);
        updateRequest.setPrice(new BigDecimal("999.99"));

        mockMvc.perform(put("/api/inventory/" + tenantAItemId.toString())
                        .header("X-Tenant-ID", TENANT_B)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        TenantContext.setTenantId(TENANT_A);
        InventoryItem originalItem = inventoryRepository.findById(tenantAItemId).orElse(null);
        assertNotNull(originalItem);
        assertEquals("Product-A", originalItem.getName());
        assertEquals("SKU-A-001", originalItem.getSku());
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldPreventCrossTenantDataDeletion() throws Exception {
        TenantContext.setTenantId(TENANT_A);
        String tenantAItemId = inventoryRepository.findAll().get(0).getId().toString();
        TenantContext.clear();

        mockMvc.perform(delete("/api/inventory/" + tenantAItemId)
                        .header("X-Tenant-ID", TENANT_B))
                .andExpect(status().isNotFound());

        TenantContext.setTenantId(TENANT_A);
        assertTrue(inventoryRepository.existsById(UUID.fromString(tenantAItemId)));
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldMaintainTenantIsolationUnderConcurrentLoad() throws Exception {
        int threadCount = 10;
        int operationsPerThread = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        List<Exception> exceptions = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            final String tenantId = threadId % 2 == 0 ? TENANT_A : TENANT_B;

            executor.submit(() -> {
                try {
                    for (int j = 0; j < operationsPerThread; j++) {
                        InventoryItemDTO item = new InventoryItemDTO();
                        item.setName("Product-" + threadId + "-" + j);
                        item.setSku("SKU-" + threadId + "-" + j);
                        item.setQuantity(50);
                        item.setPrice(new BigDecimal("50.00"));

                        String itemId = mockMvc.perform(post("/api/inventory")
                                        .header("X-Tenant-ID", tenantId)
                                        .header("X-Organization-Plan", "free")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(item)))
                                .andExpect(status().isCreated())
                                .andReturn().getResponse().getContentAsString();

                        mockMvc.perform(get("/api/inventory/" + itemId)
                                        .header("X-Tenant-ID", tenantId)
                                        .header("X-Organization-Plan", "free"))
                                .andExpect(status().isOk());

                        item.setQuantity(75);
                        mockMvc.perform(put("/api/inventory/" + itemId)
                                        .header("X-Tenant-ID", tenantId)
                                        .header("X-Organization-Plan", "free")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(item)))
                                .andExpect(status().isOk());
                    }
                } catch (Exception e) {
                    exceptions.add(e);
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS), "Concurrent operations should complete within 30 seconds");
        assertTrue(exceptions.isEmpty(), "No exceptions should occur during concurrent operations: " + exceptions);

        TenantContext.setTenantId(TENANT_A);
        long tenantACount = inventoryRepository.count();
        TenantContext.clear();

        TenantContext.setTenantId(TENANT_B);
        long tenantBCount = inventoryRepository.count();
        TenantContext.clear();

        System.out.println("Tenant A count: " + tenantACount);
        System.out.println("Tenant B count: " + tenantBCount);

        assertTrue(tenantACount >= 1, "Tenant A should have at least the setup item");
        assertTrue(tenantBCount >= 1, "Tenant B should have at least the setup item");

        executor.shutdown();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldHandleTenantContextCleanupCorrectly() throws Exception {
        InventoryItemDTO item = new InventoryItemDTO();
        item.setName("Test Product");
        item.setSku("TEST-001");
        item.setQuantity(25);
        item.setPrice(new BigDecimal("25.00"));

        String itemId = mockMvc.perform(post("/api/inventory")
                        .header("X-Tenant-ID", TENANT_A)
                        .header("X-Organization-Plan", "free")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(item)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        mockMvc.perform(get("/api/inventory")
                        .header("X-Tenant-ID", TENANT_A)
                        .header("X-Organization-Plan", "free"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.total").value(2));

        mockMvc.perform(get("/api/inventory")
                        .header("X-Tenant-ID", TENANT_B)
                        .header("X-Organization-Plan", "free"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.total").value(1));
    }

    private void addItemsToTenant(String tenantId, String name, String sku, int quantity) {
        TenantContext.setTenantId(tenantId);

        InventoryItemDTO item = new InventoryItemDTO();
        item.setName(name);
        item.setSku(sku);
        item.setQuantity(quantity);
        item.setPrice(new BigDecimal("49.99"));
        inventoryRepository.save(convertToEntity(item));

        TenantContext.clear();
    }

    private InventoryItem convertToEntity(InventoryItemDTO dto) {
        InventoryItem item = new InventoryItem();
        item.setId(dto.getId());
        item.setName(dto.getName());
        item.setSku(dto.getSku());
        item.setCategory(dto.getCategory());
        item.setQuantity(dto.getQuantity());
        item.setMinThreshold(dto.getMinThreshold());
        item.setPrice(dto.getPrice());
        item.setTenantId(dto.getTenantId());
        return item;
    }
}
