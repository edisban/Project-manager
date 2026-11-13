package com.edis.backendproject.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edis.backendproject.dto.PageResponse;
import com.edis.backendproject.dto.ProjectRequest;
import com.edis.backendproject.dto.ProjectResponse;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.model.Project;
import com.edis.backendproject.repository.ProjectRepository;
import com.edis.backendproject.repository.UserRepository;
import com.edis.backendproject.security.AppUserPrincipal;

import lombok.RequiredArgsConstructor;

/**
 * Project use cases. Users only see and change their own projects; admins see and change all of them.
 * Projects the caller may not access are reported as "not found" so their existence is not revealed.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectService {

    private static final String DUPLICATE_NAME = "You already have a project with this name";

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public PageResponse<ProjectResponse> list(AppUserPrincipal user, String query, Pageable pageable) {
        String pattern = SearchPatterns.contains(query);
        Page<Project> page = user.isAdmin()
                ? projectRepository.search(pattern, pageable)
                : projectRepository.searchByOwner(user.getId(), pattern, pageable);
        return PageResponse.from(page, ProjectResponse::from);
    }

    public ProjectResponse get(Long id, AppUserPrincipal user) {
        return ProjectResponse.from(requireAccessible(id, user));
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request, AppUserPrincipal user) {
        String name = request.name().trim();
        if (projectRepository.existsByOwnerIdAndNameIgnoreCase(user.getId(), name)) {
            throw new ConflictException(DUPLICATE_NAME);
        }
        Project project = Project.builder()
                .name(name)
                .description(normalize(request.description()))
                .owner(userRepository.getReferenceById(user.getId()))
                .build();
        return ProjectResponse.from(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request, AppUserPrincipal user) {
        Project project = requireAccessible(id, user);
        String name = request.name().trim();
        Long ownerId = project.getOwner().getId();
        if (projectRepository.existsByOwnerIdAndNameIgnoreCaseAndIdNot(ownerId, name, id)) {
            throw new ConflictException(DUPLICATE_NAME);
        }
        project.setName(name);
        project.setDescription(normalize(request.description()));
        return ProjectResponse.from(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public void delete(Long id, AppUserPrincipal user) {
        projectRepository.delete(requireAccessible(id, user));
    }

    /**
     * Loads a project the caller may access, or throws {@link ResourceNotFoundException}.
     */
    public Project requireAccessible(Long id, AppUserPrincipal user) {
        Project project = projectRepository.findWithOwnerById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!user.isAdmin() && !project.isOwnedBy(user.getId())) {
            throw new ResourceNotFoundException("Project not found");
        }
        return project;
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
