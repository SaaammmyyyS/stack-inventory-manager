package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class BusinessLogicException extends BaseException {
    
    public BusinessLogicException(String message) {
        super("BUSINESS_LOGIC_ERROR", HttpStatus.BAD_REQUEST.value(), message);
    }
    
    public BusinessLogicException(String message, Map<String, Object> details) {
        super("BUSINESS_LOGIC_ERROR", HttpStatus.BAD_REQUEST.value(), message, details);
    }
    
    public BusinessLogicException(String message, Throwable cause) {
        super("BUSINESS_LOGIC_ERROR", HttpStatus.BAD_REQUEST.value(), message, cause);
    }
    
    public BusinessLogicException(String message, Map<String, Object> details, Throwable cause) {
        super("BUSINESS_LOGIC_ERROR", HttpStatus.BAD_REQUEST.value(), message, details, null, cause);
    }
}
