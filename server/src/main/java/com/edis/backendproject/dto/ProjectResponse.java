package com.edis.backendproject.dto;

import java.time.Instant;
import java.time.ZoneOffset;

import com.edis.backendproject.model.Project;

public record ProjectResponse(
        Long id,
        String name,
        String description,
        Instant createdAt,
        long studentCount,
        String ownerUsername) {

    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                toInstant(project.getCreatedAt()),
                project.getStudentCount(),
                project.getOwner() != null ? project.getOwner().getUsername() : null);
    }

    /** Entities store UTC wall-clock time; the API exposes unambiguous instants. */
    static Instant toInstant(java.time.LocalDateTime utc) {
        return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
    }
}
