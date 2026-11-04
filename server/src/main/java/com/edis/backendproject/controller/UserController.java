package com.edis.backendproject.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edis.backendproject.security.AppUserPrincipal;
import com.edis.backendproject.security.AuthCookieService;
import com.edis.backendproject.service.TokenBlacklistService;
import com.edis.backendproject.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthCookieService authCookieService;

    /** Deletes the caller's account (and their projects), revokes the token and clears the cookie. */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteOwnAccount(@AuthenticationPrincipal AppUserPrincipal user,
                                                 HttpServletRequest request) {
        userService.deleteOwnAccount(user);
        authCookieService.read(request).ifPresent(tokenBlacklistService::revoke);
        log.info("User '{}' deleted their account", user.getUsername());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clear().toString())
                .build();
    }
}
