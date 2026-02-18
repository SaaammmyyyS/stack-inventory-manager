package com.inventory.saas;

import com.inventory.saas.config.TenantContext;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.service.BillingGuard;
import com.inventory.saas.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

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
public class InventoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private BillingGuard billingGuard;

    @BeforeEach
    void setup() {
        when(rateLimitService.isAllowed(anyString(), anyInt())).thenReturn(true);
        when(billingGuard.getLimits(anyString())).thenReturn(new BillingGuard.PlanLimits(1000, 10000, 50, 500000));
        when(billingGuard.getUsageStats(anyString(), anyString())).thenReturn(new BillingGuard.UsageStats(0, 5, 0, 1, 0, 15000));
        inventoryRepository.deleteAll();

        TenantContext.setTenantId("tenant-a");
        InventoryItem item = new InventoryItem();
        item.setName("Test Product");
        item.setSku("PROD-001");
        item.setQuantity(50);
        item.setPrice(new BigDecimal("99.99"));
        inventoryRepository.save(item);
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldBlockCrossTenantAccess() throws Exception {
        mockMvc.perform(get("/api/inventory")
                        .header("X-Tenant-ID", "tenant-b"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void userRoleShouldNotBeAllowedToDelete() throws Exception {
        String randomId = UUID.randomUUID().toString();
        mockMvc.perform(delete("/api/inventory/" + randomId)
                        .header("X-Tenant-ID", "tenant-a"))
                .andExpect(status().isForbidden());
    }
}