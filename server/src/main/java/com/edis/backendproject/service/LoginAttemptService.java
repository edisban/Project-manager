package com.edis.backendproject.service;

import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.edis.backendproject.exception.AppExceptions.TooManyRequestsException;
import com.edis.backendproject.security.AuthProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Brute-force protection: after too many failed logins for the same username from the same IP,
 * further attempts are rejected with HTTP 429 until the lockout window passes.
 * <p>
 * If Redis is unavailable the limiter fails open (logins keep working) and logs a warning.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final String KEY_PREFIX = "auth:login-failures:";

    private final StringRedisTemplate redis;
    private final AuthProperties properties;

    public void ensureNotLocked(String username, String clientIp) {
        String key = key(username, clientIp);
        try {
            String value = redis.opsForValue().get(key);
            if (value != null && Long.parseLong(value) >= properties.maxLoginAttempts()) {
                Long ttlSeconds = redis.getExpire(key, TimeUnit.SECONDS);
                Duration retryAfter = ttlSeconds != null && ttlSeconds > 0
                        ? Duration.ofSeconds(ttlSeconds)
                        : properties.loginLockout();
                throw new TooManyRequestsException(
                        "Too many failed login attempts. Please try again later.", retryAfter);
            }
        } catch (DataAccessException ex) {
            log.warn("Login rate limiter unavailable", ex);
        }
    }

    public void recordFailure(String username, String clientIp) {
        String key = key(username, clientIp);
        try {
            Long failures = redis.opsForValue().increment(key);
            if (failures != null && failures == 1L) {
                redis.expire(key, properties.loginLockout());
            }
        } catch (DataAccessException ex) {
            log.warn("Login rate limiter unavailable", ex);
        }
    }

    public void reset(String username, String clientIp) {
        try {
            redis.delete(key(username, clientIp));
        } catch (DataAccessException ex) {
            log.warn("Login rate limiter unavailable", ex);
        }
    }

    private static String key(String username, String clientIp) {
        return KEY_PREFIX + username.toLowerCase(Locale.ROOT) + ":" + clientIp;
    }
}
