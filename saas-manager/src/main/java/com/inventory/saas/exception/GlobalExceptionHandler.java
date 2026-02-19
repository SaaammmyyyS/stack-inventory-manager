package com.inventory.saas.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(ex.getHttpStatus())
                .error(ex.getErrorCode())
                .message(ex.getMessage())
                .details(ex.getDetails())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.valueOf(ex.getHttpStatus()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        Map<String, Object> validationDetails = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            validationDetails.put(error.getField(), Map.of(
                    "rejectedValue", error.getRejectedValue(),
                    "reason", error.getDefaultMessage()
            ));
        });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Request validation failed")
                .details(validationDetails)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(HttpStatus.FORBIDDEN.value())
                .error("ACCESS_DENIED")
                .message("You do not have permission to perform this action.")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(ex.getStatusCode().value())
                .error("SUBSCRIPTION_LIMIT")
                .message(ex.getReason())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, ex.getStatusCode());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(HttpStatus.BAD_REQUEST.value())
                .error("INVALID_ARGUMENT")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(HttpStatus.BAD_REQUEST.value())
                .error("ILLEGAL_STATE")
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, WebRequest request) {
        String correlationId = generateCorrelationId();

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .correlationId(correlationId)
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred.")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        logError(ex, correlationId, request);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }

    private void logError(Exception ex, String correlationId, WebRequest request) {
        String path = request.getDescription(false).replace("uri=", "");

        if (ex instanceof BaseException) {
            BaseException baseEx = (BaseException) ex;
            logger.warn("Application error [{}] correlationId={} path={} message={} details={}",
                    baseEx.getErrorCode(), correlationId, path, baseEx.getMessage(), baseEx.getDetails(), ex);
        } else {
            logger.error("Unexpected error correlationId={} path={} message={}",
                    correlationId, path, ex.getMessage(), ex);
        }
    }

    public static class ErrorResponse {
        private LocalDateTime timestamp;
        private String correlationId;
        private int status;
        private String error;
        private String message;
        private Map<String, Object> details;
        private String path;

        public static ErrorResponseBuilder builder() {
            return new ErrorResponseBuilder();
        }

        public LocalDateTime getTimestamp() { return timestamp; }
        public String getCorrelationId() { return correlationId; }
        public int getStatus() { return status; }
        public String getError() { return error; }
        public String getMessage() { return message; }
        public Map<String, Object> getDetails() { return details; }
        public String getPath() { return path; }

        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
        public void setStatus(int status) { this.status = status; }
        public void setError(String error) { this.error = error; }
        public void setMessage(String message) { this.message = message; }
        public void setDetails(Map<String, Object> details) { this.details = details; }
        public void setPath(String path) { this.path = path; }

        public static class ErrorResponseBuilder {
            private LocalDateTime timestamp;
            private String correlationId;
            private int status;
            private String error;
            private String message;
            private Map<String, Object> details;
            private String path;

            public ErrorResponseBuilder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public ErrorResponseBuilder correlationId(String correlationId) {
                this.correlationId = correlationId;
                return this;
            }

            public ErrorResponseBuilder status(int status) {
                this.status = status;
                return this;
            }

            public ErrorResponseBuilder error(String error) {
                this.error = error;
                return this;
            }

            public ErrorResponseBuilder message(String message) {
                this.message = message;
                return this;
            }

            public ErrorResponseBuilder details(Map<String, Object> details) {
                this.details = details;
                return this;
            }

            public ErrorResponseBuilder path(String path) {
                this.path = path;
                return this;
            }

            public ErrorResponse build() {
                ErrorResponse response = new ErrorResponse();
                response.timestamp = this.timestamp;
                response.correlationId = this.correlationId;
                response.status = this.status;
                response.error = this.error;
                response.message = this.message;
                response.details = this.details;
                response.path = this.path;
                return response;
            }
        }
    }
}