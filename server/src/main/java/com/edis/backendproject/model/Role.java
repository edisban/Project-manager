package com.edis.backendproject.model;

/**
 * Application roles. {@code ADMIN} can see and manage every project; {@code USER} only their own.
 */
public enum Role {
    USER,
    ADMIN;

    /** Spring Security authority name, e.g. {@code ROLE_ADMIN}. */
    public String authority() {
        return "ROLE_" + name();
    }
}
