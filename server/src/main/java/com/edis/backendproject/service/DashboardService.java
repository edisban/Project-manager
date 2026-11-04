package com.edis.backendproject.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edis.backendproject.dto.DashboardResponse;
import com.edis.backendproject.dto.DashboardResponse.DailyCount;
import com.edis.backendproject.dto.ProjectResponse;
import com.edis.backendproject.dto.StudentResponse;
import com.edis.backendproject.repository.ProjectRepository;
import com.edis.backendproject.repository.StudentRepository;
import com.edis.backendproject.security.AppUserPrincipal;

import lombok.RequiredArgsConstructor;

/**
 * Builds the overview: totals, recent activity, biggest projects and newest students.
 * Users see figures for their own projects; admins see the whole workspace.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardService {

    private static final int ACTIVITY_DAYS = 14;
    private static final int TOP_PROJECTS = 5;
    private static final int RECENT_STUDENTS = 5;

    private final ProjectRepository projectRepository;
    private final StudentRepository studentRepository;

    public DashboardResponse overview(AppUserPrincipal user) {
        // Timestamps are stored as UTC wall-clock time, so days are UTC days.
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate firstDay = today.minusDays(ACTIVITY_DAYS - 1L);
        LocalDateTime since = firstDay.atStartOfDay();

        boolean all = user.isAdmin();
        Long ownerId = user.getId();

        long projectCount = all ? projectRepository.count() : projectRepository.countByOwnerId(ownerId);
        long studentCount = all ? studentRepository.count() : studentRepository.countByOwner(ownerId);

        Map<LocalDate, Long> perDay = (all
                ? studentRepository.dailyAdditions(since)
                : studentRepository.dailyAdditionsByOwner(ownerId, since))
                .stream()
                .collect(Collectors.toMap(DailyCount::day, DailyCount::count));
        List<DailyCount> activity = firstDay.datesUntil(today.plusDays(1))
                .map(day -> new DailyCount(day, perDay.getOrDefault(day, 0L)))
                .toList();
        long lastWeek = activity.subList(ACTIVITY_DAYS - 7, ACTIVITY_DAYS).stream()
                .mapToLong(DailyCount::count)
                .sum();

        PageRequest biggest = PageRequest.of(0, TOP_PROJECTS,
                Sort.by(Sort.Order.desc("studentCount"), Sort.Order.asc("name")));
        List<ProjectResponse> topProjects = (all
                ? projectRepository.search("%", biggest)
                : projectRepository.searchByOwner(ownerId, "%", biggest))
                .map(ProjectResponse::from)
                .getContent();

        PageRequest newest = PageRequest.of(0, RECENT_STUDENTS, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        List<StudentResponse> recentStudents = (all
                ? studentRepository.findRecent(newest)
                : studentRepository.findRecentByOwner(ownerId, newest))
                .stream()
                .map(StudentResponse::from)
                .toList();

        return new DashboardResponse(projectCount, studentCount, lastWeek, activity, topProjects, recentStudents);
    }
}
