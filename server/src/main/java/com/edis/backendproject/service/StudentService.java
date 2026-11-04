package com.edis.backendproject.service;

import java.util.Objects;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edis.backendproject.dto.PageResponse;
import com.edis.backendproject.dto.StudentRequest;
import com.edis.backendproject.dto.StudentResponse;
import com.edis.backendproject.exception.AppExceptions.ConflictException;
import com.edis.backendproject.exception.AppExceptions.ResourceNotFoundException;
import com.edis.backendproject.model.Project;
import com.edis.backendproject.model.Student;
import com.edis.backendproject.repository.StudentRepository;
import com.edis.backendproject.security.AppUserPrincipal;

import lombok.RequiredArgsConstructor;

/**
 * Student use cases. Access to a student is granted through access to its project.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StudentService {

    private static final String DUPLICATE_CODE = "A student with this ID already exists in the project";

    private final StudentRepository studentRepository;
    private final ProjectService projectService;

    public PageResponse<StudentResponse> listByProject(Long projectId, AppUserPrincipal user,
                                                       String query, Pageable pageable) {
        Project project = projectService.requireAccessible(projectId, user);
        return PageResponse.from(
                studentRepository.searchInProject(project.getId(), SearchPatterns.contains(query), pageable),
                StudentResponse::from);
    }

    public StudentResponse get(Long id, AppUserPrincipal user) {
        return StudentResponse.from(requireAccessible(id, user));
    }

    @Transactional
    public StudentResponse create(StudentRequest request, AppUserPrincipal user) {
        Project project = projectService.requireAccessible(request.projectId(), user);
        String code = request.codeNumber().trim();
        if (studentRepository.existsByProjectIdAndCodeNumber(project.getId(), code)) {
            throw new ConflictException(DUPLICATE_CODE);
        }
        Student student = new Student();
        apply(student, request);
        student.setProject(project);
        return StudentResponse.from(studentRepository.saveAndFlush(student));
    }

    /**
     * Updates a student, including moving them to another project the caller can access.
     */
    @Transactional
    public StudentResponse update(Long id, StudentRequest request, AppUserPrincipal user) {
        Student student = requireAccessible(id, user);
        Project target = Objects.equals(student.getProject().getId(), request.projectId())
                ? student.getProject()
                : projectService.requireAccessible(request.projectId(), user);

        String code = request.codeNumber().trim();
        if (studentRepository.existsByProjectIdAndCodeNumberAndIdNot(target.getId(), code, id)) {
            throw new ConflictException(DUPLICATE_CODE);
        }
        apply(student, request);
        student.setProject(target);
        return StudentResponse.from(studentRepository.saveAndFlush(student));
    }

    @Transactional
    public void delete(Long id, AppUserPrincipal user) {
        studentRepository.delete(requireAccessible(id, user));
    }

    private Student requireAccessible(Long id, AppUserPrincipal user) {
        Student student = studentRepository.findWithProjectById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        if (!user.isAdmin() && !student.getProject().isOwnedBy(user.getId())) {
            throw new ResourceNotFoundException("Student not found");
        }
        return student;
    }

    private static void apply(Student student, StudentRequest request) {
        student.setCodeNumber(request.codeNumber().trim());
        student.setFirstName(request.firstName().trim());
        student.setLastName(request.lastName().trim());
        student.setDateOfBirth(request.dateOfBirth());
        student.setTitle(request.title().trim());
        student.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
    }
}
