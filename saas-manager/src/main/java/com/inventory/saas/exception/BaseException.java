package com.inventory.saas.exception;

import java.util.Map;

public abstract class BaseException extends RuntimeException {
    private final String errorCode;
    private final int httpStatus;
    private final Map<String, Object> details;
    private final String correlationId;

    protected BaseException(String errorCode, int httpStatus, String message) {
        this(errorCode, httpStatus, message, null, null);
    }

    protected BaseException(String errorCode, int httpStatus, String message, Map<String, Object> details) {
        this(errorCode, httpStatus, message, details, null);
    }

    protected BaseException(String errorCode, int httpStatus, String message, Map<String, Object> details, String correlationId) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.details = details;
        this.correlationId = correlationId;
    }

    protected BaseException(String errorCode, int httpStatus, String message, Throwable cause) {
        this(errorCode, httpStatus, message, null, null, cause);
    }

    protected BaseException(String errorCode, int httpStatus, String message, Map<String, Object> details, String correlationId, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.details = details;
        this.correlationId = correlationId;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public String getCorrelationId() {
        return correlationId;
    }
}
