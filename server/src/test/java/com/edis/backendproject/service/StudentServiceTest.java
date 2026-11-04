package com.edis.backendproject.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.edis.backendproject.dto.StudentRequest;
import com.edis.backendproject.dto.StudentResponse;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.model.Project;
import com.edis.backendproject.model.Role;
import com.edis.backendproject.model.Student;
import com.edis.backendproject.model.User;
import com.edis.backendproject.repository.StudentRepository;
import com.edis.backendproject.security.AppUserPrincipal;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    private static final AppUserPrincipal ALICE = new AppUserPrincipal(1L, "alice", "x", Role.USER);
    private static final AppUserPrincipal BOB = new AppUserPrincipal(2L, "bob", "x", Role.USER);

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private StudentService studentService;

    private final Project apollo = project(10L, "Apollo");
    private final Project gemini = project(20L, "Gemini");

    @Test
    void createRejectsDuplicateCodeWithinProject() {
        when(projectService.requireAccessible(10L, ALICE)).thenReturn(apollo);
        when(studentRepository.existsByProjectIdAndCodeNumber(10L, "123456")).thenReturn(true);

        assertThatThrownBy(() -> studentService.create(request(10L), ALICE))
                .isInstanceOf(ConflictException.class);
        verify(studentRepository, never()).saveAndFlush(any());
    }

    @Test
    void createTrimsFieldsAndAttachesProject() {
        when(projectService.requireAccessible(10L, ALICE)).thenReturn(apollo);
        when(studentRepository.saveAndFlush(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentResponse created = studentService.create(request(10L), ALICE);

        assertThat(created.firstName()).isEqualTo("Ada");
        assertThat(created.projectId()).isEqualTo(10L);
        assertThat(created.projectName()).isEqualTo("Apollo");
    }

    @Test
    void updateMovesStudentToAnotherAccessibleProject() {
        Student existing = Student.builder().id(7L).codeNumber("1").firstName("A").lastName("B")
                .title("T").project(apollo).build();
        when(studentRepository.findWithProjectById(7L)).thenReturn(Optional.of(existing));
        when(projectService.requireAccessible(20L, ALICE)).thenReturn(gemini);
        when(studentRepository.saveAndFlush(existing)).thenReturn(existing);

        StudentResponse updated = studentService.update(7L, request(20L), ALICE);

        assertThat(updated.projectId()).isEqualTo(20L);
        assertThat(updated.projectName()).isEqualTo("Gemini");
        assertThat(updated.codeNumber()).isEqualTo("123456");
    }

    @Test
    void studentOfAnotherUsersProjectIsReportedAsNotFound() {
        Student existing = Student.builder().id(7L).project(apollo).build();
        when(studentRepository.findWithProjectById(7L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> studentService.get(7L, BOB))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Student not found");
    }

    private static StudentRequest request(Long projectId) {
        return new StudentRequest(" 123456 ", " Ada ", "Lovelace", LocalDate.of(1990, 1, 1),
                "Engineer", null, projectId);
    }

    private static Project project(Long id, String name) {
        return Project.builder().id(id).name(name).owner(User.builder().id(1L).build()).build();
    }
}
