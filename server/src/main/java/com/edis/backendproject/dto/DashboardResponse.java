package com.edis.backendproject.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Overview for the signed-in user (or the whole workspace for admins).
 *
 * @param activity students added per UTC day, oldest first, one entry per day (zero-filled)
 */
public record DashboardResponse(
        long projectCount,
        long studentCount,
        long studentsAddedLast7Days,
        List<DailyCount> activity,
        List<ProjectResponse> topProjects,
        List<StudentResponse> recentStudents) {

    public record DailyCount(LocalDate day, long count) {
    }
}
