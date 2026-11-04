package com.edis.backendproject.controller;

import java.net.URI;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.dto.StudentRequest;
import com.edis.backendproject.dto.StudentResponse;
import com.edis.backendproject.security.AppUserPrincipal;
import com.edis.backendproject.service.StudentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Single-student operations. Listing and searching live under {@code /api/projects/{id}/students}.
 */
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/{id}")
    public ApiResponse<StudentResponse> get(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal user) {
        return ApiResponse.success(studentService.get(id, user));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<StudentResponse>> create(@Valid @RequestBody StudentRequest request,
                                                               @AuthenticationPrincipal AppUserPrincipal user) {
        StudentResponse created = studentService.create(request, user);
        return ResponseEntity.created(URI.create("/api/students/" + created.id()))
                .body(ApiResponse.success("Student added", created));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<StudentResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody StudentRequest request,
                                               @AuthenticationPrincipal AppUserPrincipal user) {
        return ApiResponse.success("Student updated", studentService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal user) {
        studentService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
