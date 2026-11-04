package com.edis.backendproject.security;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.boot.convert.DurationUnit;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * JWT settings. The application refuses to start with a secret shorter than 256 bits.
 *
 * @param secret     HMAC signing secret (at least 32 characters)
 * @param expiration token lifetime; plain numbers are milliseconds (e.g. {@code 86400000}), or use {@code 24h}
 */
@Validated
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        @NotBlank(message = "jwt.secret (JWT_SECRET) must be set")
        @Size(min = 32, message = "jwt.secret (JWT_SECRET) must be at least 32 characters")
        String secret,

        @DurationUnit(ChronoUnit.MILLIS)
        @DefaultValue("24h")
        Duration expiration) {
}
