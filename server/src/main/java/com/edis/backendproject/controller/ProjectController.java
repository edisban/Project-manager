package com.edis.backendproject.controller;

import java.net.URI;
import java.util.Set;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edis.backendproject.dto.ApiResponse;
import com.edis.backendproject.dto.PageResponse;
import com.edis.backendproject.dto.ProjectRequest;
import com.edis.backendproject.dto.ProjectResponse;
import com.edis.backendproject.dto.StudentResponse;
import com.edis.backendproject.security.AppUserPrincipal;
import com.edis.backendproject.service.ProjectService;
import com.edis.backendproject.service.StudentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private static final Set<String> PROJECT_SORTS = Set.of("createdAt", "name", "studentCount");
    private static final Set<String> STUDENT_SORTS = Set.of("lastName", "firstName", "codeNumber", "createdAt");

    private final ProjectService projectService;
    private final StudentService studentService;

    @GetMapping
    public ApiResponse<PageResponse<ProjectResponse>> list(
            @AuthenticationPrincipal AppUserPrincipal user,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(projectService.list(user, q, Pageables.restrictSort(pageable, PROJECT_SORTS)));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> get(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal user) {
        return ApiResponse.success(projectService.get(id, user));
    }

    @GetMapping("/{id}/students")
    public ApiResponse<PageResponse<StudentResponse>> students(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserPrincipal user,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = {"lastName", "firstName"}) Pageable pageable) {
        return ApiResponse.success(
                studentService.listByProject(id, user, q, Pageables.restrictSort(pageable, STUDENT_SORTS)));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ProjectResponse>> create(@Valid @RequestBody ProjectRequest request,
                                                               @AuthenticationPrincipal AppUserPrincipal user) {
        ProjectResponse created = projectService.create(request, user);
        return ResponseEntity.created(URI.create("/api/projects/" + created.id()))
                .body(ApiResponse.success("Project created", created));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProjectResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody ProjectRequest request,
                                               @AuthenticationPrincipal AppUserPrincipal user) {
        return ApiResponse.success("Project updated", projectService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal user) {
        projectService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
