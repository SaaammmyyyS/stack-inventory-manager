package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND.value(), message);
    }

    public ResourceNotFoundException(String message, Map<String, Object> details) {
        super("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND.value(), message, details);
    }

    public ResourceNotFoundException(String message, String resourceType, Object resourceId) {
        super("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND.value(), message,
              Map.of("resourceType", resourceType, "resourceId", resourceId));
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND.value(), message, cause);
    }
}