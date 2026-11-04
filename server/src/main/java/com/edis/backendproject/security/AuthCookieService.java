package com.edis.backendproject.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.WebUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Builds and reads the HttpOnly cookie that carries the JWT, so the token is never exposed to JavaScript.
 */
@Component
@RequiredArgsConstructor
public class AuthCookieService {

    private static final String COOKIE_PATH = "/api";

    private final AuthProperties properties;

    public ResponseCookie create(JwtTokenProvider.IssuedToken token) {
        Duration maxAge = Duration.between(Instant.now(), token.expiresAt());
        return base(token.value()).maxAge(maxAge).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    public Optional<String> read(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, properties.cookieName());
        return Optional.ofNullable(cookie)
                .map(Cookie::getValue)
                .filter(StringUtils::hasText);
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(properties.cookieName(), value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Strict")
                .path(COOKIE_PATH);
    }
}
