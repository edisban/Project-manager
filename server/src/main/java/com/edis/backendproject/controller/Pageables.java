package com.edis.backendproject.controller;

import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Restricts client-supplied sort properties to an allow-list, so clients cannot sort by arbitrary
 * (possibly sensitive or nested) entity attributes.
 */
final class Pageables {

    private Pageables() {
    }

    static Pageable restrictSort(Pageable pageable, Set<String> allowedProperties) {
        for (Sort.Order order : pageable.getSort()) {
            if (!allowedProperties.contains(order.getProperty())) {
                throw new IllegalArgumentException("Unsupported sort property: " + order.getProperty());
            }
        }
        // Add a stable tie-breaker so pages never overlap or skip rows.
        Sort sort = pageable.getSort().and(Sort.by(Sort.Direction.ASC, "id"));
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
