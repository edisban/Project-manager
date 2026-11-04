package com.edis.backendproject.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ForbiddenOperationException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.exception.AppExceptions.TooManyRequestsException;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * Translates every exception into the {@link ApiResponse} envelope with the correct status code.
 * <p>
 * Extending {@link ResponseEntityExceptionHandler} keeps Spring MVC's own status mapping for framework
 * errors (malformed JSON, type mismatches, missing parameters, unknown routes, wrong HTTP method, ...),
 * so those return 4xx instead of falling through to the generic 500 handler.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(error.getField(), Objects.toString(error.getDefaultMessage(), "Invalid value")));
        String message = errors.size() == 1 ? errors.values().iterator().next() : "Please correct the highlighted fields";
        return ResponseEntity.badRequest().body(ApiResponse.validationError(message, errors));
    }

    /** Framework exceptions handled by the base class end up here; wrap them in our envelope. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex,
                                                             @Nullable Object body,
                                                             HttpHeaders headers,
                                                             HttpStatusCode statusCode,
                                                             WebRequest request) {
        String message = switch (statusCode.value()) {
            case 404 -> "Resource not found";
            case 405 -> "Method not allowed";
            case 406, 415 -> "Unsupported media type";
            case 400 -> body instanceof ProblemDetail detail && detail.getDetail() != null
                    ? detail.getDetail()
                    : "Malformed request";
            default -> statusCode.is5xxServerError() ? "Unexpected error occurred" : "Request could not be processed";
        };
        if (statusCode.is5xxServerError()) {
            log.error("Request failed", ex);
        }
        return ResponseEntity.status(statusCode).headers(headers).body(ApiResponse.error(message));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenOperationException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooManyRequests(TooManyRequestsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, ex.getRetryAfter().toSeconds())))
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler({IllegalArgumentException.class, PropertyReferenceException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadArgument(RuntimeException ex) {
        return error(HttpStatus.BAD_REQUEST, Objects.toString(ex.getMessage(), "Invalid request"));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                errors.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage()));
        return ResponseEntity.badRequest().body(ApiResponse.validationError("Invalid request", errors));
    }

    /** Safety net for races between the service-level duplicate checks and the database constraints. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String detail = Objects.toString(ex.getMostSpecificCause().getMessage(), "");
        if (detail.contains("uq_students_project_code")) {
            return error(HttpStatus.CONFLICT, "A student with this ID already exists in the project");
        }
        if (detail.contains("uq_projects_owner_name")) {
            return error(HttpStatus.CONFLICT, "You already have a project with this name");
        }
        if (detail.contains("users_username_key")) {
            return error(HttpStatus.CONFLICT, "This username is already taken");
        }
        log.warn("Data integrity violation: {}", detail);
        return error(HttpStatus.CONFLICT, "The request conflicts with existing data");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error occurred");
    }

    private static ResponseEntity<ApiResponse<Void>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(message));
    }
}
