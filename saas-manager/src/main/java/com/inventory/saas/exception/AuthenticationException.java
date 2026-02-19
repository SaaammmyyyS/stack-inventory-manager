package com.inventory.saas.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class AuthenticationException extends BaseException {
    
    public AuthenticationException(String message) {
        super("AUTHENTICATION_ERROR", HttpStatus.UNAUTHORIZED.value(), message);
    }
    
    public AuthenticationException(String message, Map<String, Object> details) {
        super("AUTHENTICATION_ERROR", HttpStatus.UNAUTHORIZED.value(), message, details);
    }
    
    public AuthenticationException(String message, Throwable cause) {
        super("AUTHENTICATION_ERROR", HttpStatus.UNAUTHORIZED.value(), message, cause);
    }
    
    public AuthenticationException(String message, Map<String, Object> details, Throwable cause) {
        super("AUTHENTICATION_ERROR", HttpStatus.UNAUTHORIZED.value(), message, details, null, cause);
    }
}
