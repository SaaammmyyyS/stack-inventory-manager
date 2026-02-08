package com.inventory.saas.controller;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/test")
public class DataInitController {

    private static final Logger logger = LoggerFactory.getLogger(DataInitController.class);
    private final InventoryRepository inventoryRepository;
    private final TransactionRepository transactionRepository;

    public DataInitController(InventoryRepository inventoryRepository, TransactionRepository transactionRepository) {
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/init-sample-data")
    public ResponseEntity<Map<String, Object>> initSampleData() {
        try {
            String tenantId = "test-tenant";

            InventoryItem item1 = new InventoryItem();
            item1.setId(UUID.randomUUID());
            item1.setName("Test Item 1");
            item1.setSku("TEST001");
            item1.setQuantity(50);
            item1.setMinThreshold(20);
            item1.setTenantId(tenantId);
            inventoryRepository.save(item1);

            InventoryItem item2 = new InventoryItem();
            item2.setId(UUID.randomUUID());
            item2.setName("Test Item 2");
            item2.setSku("TEST002");
            item2.setQuantity(25);
            item2.setMinThreshold(15);
            item2.setTenantId(tenantId);
            inventoryRepository.save(item2);

            StockTransaction tx1 = new StockTransaction();
            tx1.setId(UUID.randomUUID());
            tx1.setInventoryItem(item1);
            tx1.setQuantityChange(10);
            tx1.setType("STOCK_IN");
            tx1.setReason("Initial stock");
            tx1.setPerformedBy("Admin");
            tx1.setTenantId(tenantId);
            tx1.setCreatedAt(LocalDateTime.now().minusDays(1));
            transactionRepository.save(tx1);

            StockTransaction tx2 = new StockTransaction();
            tx2.setId(UUID.randomUUID());
            tx2.setInventoryItem(item2);
            tx2.setQuantityChange(-5);
            tx2.setType("STOCK_OUT");
            tx2.setReason("Sale");
            tx2.setPerformedBy("Admin");
            tx2.setTenantId(tenantId);
            tx2.setCreatedAt(LocalDateTime.now().minusHours(2));
            transactionRepository.save(tx2);

            StockTransaction tx3 = new StockTransaction();
            tx3.setId(UUID.randomUUID());
            tx3.setInventoryItem(item1);
            tx3.setQuantityChange(15);
            tx3.setType("STOCK_IN");
            tx3.setReason("Restock");
            tx3.setPerformedBy("Admin");
            tx3.setTenantId(tenantId);
            tx3.setCreatedAt(LocalDateTime.now().minusHours(4));
            transactionRepository.save(tx3);

            logger.info("Sample data initialized successfully");

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Sample data created successfully",
                "items_created", 2,
                "transactions_created", 3
            ));

        } catch (Exception e) {
            logger.error("Failed to initialize sample data", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to create sample data: " + e.getMessage()
            ));
        }
    }
}
