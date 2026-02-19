package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class RateLimitException extends BaseException {
    
    public RateLimitException(String message) {
        super("RATE_LIMIT_ERROR", HttpStatus.TOO_MANY_REQUESTS.value(), message);
    }
    
    public RateLimitException(String message, Map<String, Object> details) {
        super("RATE_LIMIT_ERROR", HttpStatus.TOO_MANY_REQUESTS.value(), message, details);
    }
    
    public RateLimitException(String message, int retryAfterSeconds) {
        super("RATE_LIMIT_ERROR", HttpStatus.TOO_MANY_REQUESTS.value(), message, 
              Map.of("retryAfter", retryAfterSeconds));
    }
    
    public RateLimitException(String message, Throwable cause) {
        super("RATE_LIMIT_ERROR", HttpStatus.TOO_MANY_REQUESTS.value(), message, cause);
    }
}
