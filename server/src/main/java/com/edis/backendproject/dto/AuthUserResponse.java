package com.edis.backendproject.dto;

import java.time.Instant;

import com.edis.backendproject.model.Role;

/**
 * The signed-in user as seen by the client. The token itself stays in an HttpOnly cookie.
 */
public record AuthUserResponse(String username, Role role, Instant expiresAt) {
}
