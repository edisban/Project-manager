package com.edis.backendproject.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.edis.backendproject.dto.ProjectRequest;
import com.edis.backendproject.dto.ProjectResponse;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.model.Project;
import com.edis.backendproject.model.Role;
import com.edis.backendproject.model.User;
import com.edis.backendproject.repository.ProjectRepository;
import com.edis.backendproject.repository.UserRepository;
import com.edis.backendproject.security.AppUserPrincipal;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    private static final AppUserPrincipal ALICE = new AppUserPrincipal(1L, "alice", "x", Role.USER);
    private static final AppUserPrincipal BOB = new AppUserPrincipal(2L, "bob", "x", Role.USER);
    private static final AppUserPrincipal ADMIN = new AppUserPrincipal(9L, "admin", "x", Role.ADMIN);
    private static final Pageable PAGE = PageRequest.of(0, 10);

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void listForUserOnlySearchesOwnProjects() {
        when(projectRepository.searchByOwner(1L, "%web%", PAGE))
                .thenReturn(new PageImpl<>(List.of(project(5L, "Website", ALICE.getId())), PAGE, 1));

        var page = projectService.list(ALICE, " Web ", PAGE);

        assertThat(page.content()).extracting(ProjectResponse::name).containsExactly("Website");
        assertThat(page.totalElements()).isEqualTo(1);
        verify(projectRepository, never()).search(any(), any());
    }

    @Test
    void listForAdminSearchesAllProjects() {
        when(projectRepository.search("%", PAGE)).thenReturn(new PageImpl<>(List.of(), PAGE, 0));

        projectService.list(ADMIN, null, PAGE);

        verify(projectRepository).search("%", PAGE);
        verify(projectRepository, never()).searchByOwner(any(), any(), any());
    }

    @Test
    void createAssignsOwnerAndTrimsInput() {
        User owner = User.builder().id(1L).username("alice").build();
        when(projectRepository.existsByOwnerIdAndNameIgnoreCase(1L, "Apollo")).thenReturn(false);
        when(userRepository.getReferenceById(1L)).thenReturn(owner);
        when(projectRepository.saveAndFlush(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectResponse created = projectService.create(new ProjectRequest("  Apollo ", "   "), ALICE);

        ArgumentCaptor<Project> saved = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getOwner()).isSameAs(owner);
        assertThat(created.name()).isEqualTo("Apollo");
        assertThat(created.description()).isNull();
        assertThat(created.ownerUsername()).isEqualTo("alice");
    }

    @Test
    void createRejectsDuplicateNameForSameOwner() {
        when(projectRepository.existsByOwnerIdAndNameIgnoreCase(1L, "Apollo")).thenReturn(true);

        assertThatThrownBy(() -> projectService.create(new ProjectRequest("Apollo", null), ALICE))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void otherUsersProjectIsReportedAsNotFound() {
        when(projectRepository.findWithOwnerById(5L)).thenReturn(Optional.of(project(5L, "Secret", ALICE.getId())));

        assertThatThrownBy(() -> projectService.get(5L, BOB))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    void adminCanAccessAnyProject() {
        when(projectRepository.findWithOwnerById(5L)).thenReturn(Optional.of(project(5L, "Secret", ALICE.getId())));

        assertThat(projectService.get(5L, ADMIN).name()).isEqualTo("Secret");
    }

    @Test
    void updateRejectsRenamingToAnotherOwnedProjectName() {
        when(projectRepository.findWithOwnerById(5L)).thenReturn(Optional.of(project(5L, "Old", ALICE.getId())));
        when(projectRepository.existsByOwnerIdAndNameIgnoreCaseAndIdNot(1L, "Taken", 5L)).thenReturn(true);

        assertThatThrownBy(() -> projectService.update(5L, new ProjectRequest("Taken", null), ALICE))
                .isInstanceOf(ConflictException.class);
        verify(projectRepository, never()).saveAndFlush(any());
    }

    @Test
    void deleteRemovesAccessibleProject() {
        Project project = project(5L, "Old", ALICE.getId());
        when(projectRepository.findWithOwnerById(5L)).thenReturn(Optional.of(project));

        projectService.delete(5L, ALICE);

        verify(projectRepository).delete(eq(project));
    }

    private static Project project(Long id, String name, Long ownerId) {
        return Project.builder()
                .id(id)
                .name(name)
                .owner(User.builder().id(ownerId).username(ownerId.equals(1L) ? "alice" : "other").build())
                .build();
    }
}
