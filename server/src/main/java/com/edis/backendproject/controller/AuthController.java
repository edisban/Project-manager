package com.edis.backendproject.controller;

import java.time.Instant;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.dto.AuthUserResponse;
import com.edis.backendproject.dto.LoginRequest;
import com.edis.backendproject.dto.RegisterRequest;
import com.edis.backendproject.model.User;
import com.edis.backendproject.security.AppUserPrincipal;
import com.edis.backendproject.security.AuthCookieService;
import com.edis.backendproject.security.JwtTokenProvider;
import com.edis.backendproject.service.LoginAttemptService;
import com.edis.backendproject.service.TokenBlacklistService;
import com.edis.backendproject.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuthCookieService authCookieService;
    private final TokenBlacklistService tokenBlacklistService;
    private final LoginAttemptService loginAttemptService;
    private final UserService userService;

    /** Issues the {@code XSRF-TOKEN} cookie; the SPA calls this before its first state-changing request. */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<AuthUserResponse>> login(@Valid @RequestBody LoginRequest request,
                                                               HttpServletRequest httpRequest) {
        String username = request.username().trim();
        String clientIp = httpRequest.getRemoteAddr();
        loginAttemptService.ensureNotLocked(username, clientIp);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(username, request.password()));
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(username, clientIp);
            log.info("Failed login attempt for '{}' from {}", username, clientIp);
            throw new BadCredentialsException("Invalid username or password");
        }
        loginAttemptService.reset(username, clientIp);

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        JwtTokenProvider.IssuedToken token = tokenProvider.generate(principal.getUsername());
        log.info("User '{}' signed in", principal.getUsername());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.create(token).toString())
                .body(ApiResponse.success("Signed in",
                        new AuthUserResponse(principal.getUsername(), principal.getRole(), token.expiresAt())));
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<AuthUserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        log.info("User '{}' registered", user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created",
                        new AuthUserResponse(user.getUsername(), user.getRole(), null)));
    }

    /** Revokes the current token (if any) and clears the auth cookie. Safe to call when signed out. */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        authCookieService.read(request).ifPresent(tokenBlacklistService::revoke);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clear().toString())
                .body(ApiResponse.success("Signed out", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> me(@AuthenticationPrincipal AppUserPrincipal principal,
                                                            HttpServletRequest request) {
        Instant expiresAt = authCookieService.read(request)
                .flatMap(tokenProvider::parse)
                .map(claims -> claims.getExpiration().toInstant())
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.success(
                new AuthUserResponse(principal.getUsername(), principal.getRole(), expiresAt)));
    }
}
