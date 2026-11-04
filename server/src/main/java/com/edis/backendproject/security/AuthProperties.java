package com.edis.backendproject.security;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Authentication cookie and brute-force protection settings.
 *
 * @param cookieName       name of the HttpOnly cookie that carries the JWT
 * @param cookieSecure     send cookies only over HTTPS; must be {@code true} in production
 * @param maxLoginAttempts failed logins allowed per username + IP before a temporary lockout
 * @param loginLockout     how long the lockout lasts
 */
@Validated
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        @NotBlank @DefaultValue("access_token") String cookieName,
        @DefaultValue("false") boolean cookieSecure,
        @Min(1) @DefaultValue("5") int maxLoginAttempts,
        @DefaultValue("15m") Duration loginLockout) {
}
