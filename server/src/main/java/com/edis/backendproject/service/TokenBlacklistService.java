package com.edis.backendproject.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.edis.backendproject.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

/**
 * Revokes JWTs (logout, account deletion) by storing a SHA-256 hash of the token in Redis until it expires.
 * Raw tokens are never stored.
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final String KEY_PREFIX = "auth:revoked:";

    private final StringRedisTemplate redis;
    private final JwtTokenProvider tokenProvider;

    public void revoke(String token) {
        tokenProvider.parse(token).ifPresent(claims -> {
            Duration remaining = Duration.between(Instant.now(), claims.getExpiration().toInstant());
            if (!remaining.isNegative() && !remaining.isZero()) {
                redis.opsForValue().set(key(token), "1", remaining);
            }
        });
    }

    public boolean isRevoked(String token) {
        return Boolean.TRUE.equals(redis.hasKey(key(token)));
    }

    private static String key(String token) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return KEY_PREFIX + HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
