package com.inventory.saas.dto;

import java.util.UUID;

public interface InventoryTrashDTO {
    UUID getId();
    String getName();
    String getSku();
    String getCategory();
    String getDeletedBy();
}