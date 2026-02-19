package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class ConflictException extends BaseException {
    
    public ConflictException(String message) {
        super("CONFLICT_ERROR", HttpStatus.CONFLICT.value(), message);
    }
    
    public ConflictException(String message, Map<String, Object> details) {
        super("CONFLICT_ERROR", HttpStatus.CONFLICT.value(), message, details);
    }
    
    public ConflictException(String message, String field, Object conflictingValue) {
        super("CONFLICT_ERROR", HttpStatus.CONFLICT.value(), message, 
              Map.of("field", field, "conflictingValue", conflictingValue));
    }
    
    public ConflictException(String message, Throwable cause) {
        super("CONFLICT_ERROR", HttpStatus.CONFLICT.value(), message, cause);
    }
}
