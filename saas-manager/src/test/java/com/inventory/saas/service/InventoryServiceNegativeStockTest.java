package com.inventory.saas.service;

import com.inventory.saas.exception.ValidationException;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceNegativeStockTest {

    @Mock
    private InventoryRepository repository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private InventoryItem testItem;
    private UUID itemId;
    private String tenantId;

    @BeforeEach
    void setUp() {
        itemId = UUID.randomUUID();
        tenantId = "test-tenant";

        testItem = new InventoryItem();
        testItem.setId(itemId);
        testItem.setName("Test Product");
        testItem.setQuantity(10);
        testItem.setTenantId(tenantId);
    }

    @Test
    void recordMovement_StockOutWithinAllowedRange_ShouldSucceed() {
        when(repository.findByIdAndTenantIdAndDeletedFalse(itemId, tenantId))
                .thenReturn(Optional.of(testItem));
        when(repository.save(any(InventoryItem.class))).thenReturn(testItem);
        when(transactionRepository.save(any(StockTransaction.class)))
                .thenReturn(new StockTransaction());

        StockTransaction result = inventoryService.recordMovement(
                itemId, 5, "STOCK_OUT", "Test deduction", "Test User", tenantId);

        assertNotNull(result);
        verify(repository).save(testItem);
        verify(transactionRepository).save(any(StockTransaction.class));
    }

    @Test
    void recordMovement_StockOutExceedsAvailableStock_ShouldThrowValidationException() {
        when(repository.findByIdAndTenantIdAndDeletedFalse(itemId, tenantId))
                .thenReturn(Optional.of(testItem));

        ValidationException exception = assertThrows(ValidationException.class, () -> {
            inventoryService.recordMovement(
                    itemId, 15, "STOCK_OUT", "Test deduction", "Test User", tenantId);
        });

        assertEquals("VALIDATION_ERROR", exception.getErrorCode());
        assertEquals("Insufficient stock for deduction", exception.getMessage());
        assertTrue(exception.getDetails().containsKey("field"));
        assertEquals("quantity", exception.getDetails().get("field"));
        assertEquals(10, exception.getDetails().get("rejectedValue"));
        assertTrue(exception.getDetails().get("reason").toString().contains("Cannot deduct 15 units"));

        verify(repository, never()).save(any(InventoryItem.class));
        verify(transactionRepository, never()).save(any(StockTransaction.class));
    }

    @Test
    void recordMovement_StockOutExactlyEqualsAvailableStock_ShouldSucceed() {
        when(repository.findByIdAndTenantIdAndDeletedFalse(itemId, tenantId))
                .thenReturn(Optional.of(testItem));
        when(repository.save(any(InventoryItem.class))).thenReturn(testItem);
        when(transactionRepository.save(any(StockTransaction.class)))
                .thenReturn(new StockTransaction());

        StockTransaction result = inventoryService.recordMovement(
                itemId, 10, "STOCK_OUT", "Test deduction", "Test User", tenantId);

        assertNotNull(result);
        verify(repository).save(testItem);
        verify(transactionRepository).save(any(StockTransaction.class));
    }

    @Test
    void recordMovement_StockIn_ShouldNotBeAffectedByValidation() {
        when(repository.findByIdAndTenantIdAndDeletedFalse(itemId, tenantId))
                .thenReturn(Optional.of(testItem));
        when(repository.save(any(InventoryItem.class))).thenReturn(testItem);
        when(transactionRepository.save(any(StockTransaction.class)))
                .thenReturn(new StockTransaction());

        StockTransaction result = inventoryService.recordMovement(
                itemId, 100, "STOCK_IN", "Test addition", "Test User", tenantId);

        assertNotNull(result);
        verify(repository).save(testItem);
        verify(transactionRepository).save(any(StockTransaction.class));
    }

    @Test
    void recordMovement_ItemNotFound_ShouldThrowResourceNotFoundException() {
        when(repository.findByIdAndTenantIdAndDeletedFalse(itemId, tenantId))
                .thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> {
            inventoryService.recordMovement(
                    itemId, 5, "STOCK_OUT", "Test deduction", "Test User", tenantId);
        });

        verify(repository, never()).save(any(InventoryItem.class));
        verify(transactionRepository, never()).save(any(StockTransaction.class));
    }
}
