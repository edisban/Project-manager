package com.edis.backendproject.service;

import java.util.Locale;

/**
 * Builds case-insensitive "contains" patterns for JPQL {@code LIKE ... ESCAPE '\'} queries,
 * escaping user-supplied wildcards so {@code %} and {@code _} are matched literally.
 */
final class SearchPatterns {

    private SearchPatterns() {
    }

    static String contains(String query) {
        if (query == null || query.isBlank()) {
            return "%";
        }
        String escaped = query.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
