package com.edis.backendproject.exception;

import java.time.Duration;

/**
 * Domain exceptions translated to HTTP status codes by {@link GlobalExceptionHandler}.
 */
public final class AppExceptions {

    private AppExceptions() {
    }

    /** HTTP 404. Also used for resources the caller may not see, so their existence is not leaked. */
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    /** HTTP 409, e.g. a duplicate username, project name or student ID. */
    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    /** HTTP 403 for operations that are never allowed for the caller. */
    public static class ForbiddenOperationException extends RuntimeException {
        public ForbiddenOperationException(String message) {
            super(message);
        }
    }

    /** HTTP 429 with a {@code Retry-After} header. */
    public static class TooManyRequestsException extends RuntimeException {
        private final transient Duration retryAfter;

        public TooManyRequestsException(String message, Duration retryAfter) {
            super(message);
            this.retryAfter = retryAfter;
        }

        public Duration getRetryAfter() {
            return retryAfter;
        }
    }
}
