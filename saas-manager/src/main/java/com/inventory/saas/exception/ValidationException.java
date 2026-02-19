package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class ValidationException extends BaseException {
    
    public ValidationException(String message) {
        super("VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value(), message);
    }
    
    public ValidationException(String message, Map<String, Object> details) {
        super("VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value(), message, details);
    }
    
    public ValidationException(String message, String field, Object rejectedValue, String reason) {
        super("VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value(), message, 
              Map.of("field", field, "rejectedValue", rejectedValue, "reason", reason));
    }
    
    public ValidationException(String message, Throwable cause) {
        super("VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value(), message, cause);
    }
}
