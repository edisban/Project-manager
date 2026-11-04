package com.edis.backendproject.dto;

import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneOffset;

import com.edis.backendproject.model.Student;

public record StudentResponse(
        Long id,
        String codeNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String title,
        String description,
        Long projectId,
        String projectName,
        Instant createdAt) {

    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getCodeNumber(),
                student.getFirstName(),
                student.getLastName(),
                student.getDateOfBirth(),
                student.getTitle(),
                student.getDescription(),
                student.getProject().getId(),
                student.getProject().getName(),
                toInstant(student.getCreatedAt()));
    }

    /** Entities store UTC wall-clock time; the API exposes unambiguous instants. */
    static Instant toInstant(java.time.LocalDateTime utc) {
        return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
    }
}
