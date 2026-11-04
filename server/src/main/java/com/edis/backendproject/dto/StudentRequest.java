package com.edis.backendproject.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Names accept letters from any alphabet (e.g. Greek), spaces, apostrophes and hyphens.
 */
public record StudentRequest(
        @NotBlank(message = "Student ID is required")
        @Size(max = 20, message = "Student ID must be at most 20 characters")
        @Pattern(regexp = "^[0-9]+$", message = "Student ID must contain only digits")
        String codeNumber,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must be at most 100 characters")
        @Pattern(regexp = StudentRequest.NAME_PATTERN, message = "First name may only contain letters, spaces, ' and -")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must be at most 100 characters")
        @Pattern(regexp = StudentRequest.NAME_PATTERN, message = "Last name may only contain letters, spaces, ' and -")
        String lastName,

        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,

        @NotBlank(message = "Role is required")
        @Size(max = 200, message = "Role must be at most 200 characters")
        String title,

        @Size(max = 1000, message = "Notes must be at most 1000 characters")
        String description,

        @NotNull(message = "Project is required")
        Long projectId) {

    public static final String NAME_PATTERN = "^[\\p{L}][\\p{L} '\\-]*$";
}
