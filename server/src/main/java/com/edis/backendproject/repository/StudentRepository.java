package com.edis.backendproject.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edis.backendproject.dto.DashboardResponse;
import com.edis.backendproject.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {

    /**
     * Students of one project whose first name, last name, full name or student ID contains the
     * (already lower-cased, escaped) LIKE pattern.
     */
    @EntityGraph(attributePaths = "project")
    @Query("""
            select s from Student s
            where s.project.id = :projectId
              and (lower(s.firstName) like :pattern escape '\\'
                   or lower(s.lastName) like :pattern escape '\\'
                   or lower(concat(s.firstName, ' ', s.lastName)) like :pattern escape '\\'
                   or s.codeNumber like :pattern escape '\\')
            """)
    Page<Student> searchInProject(@Param("projectId") Long projectId,
                                  @Param("pattern") String pattern,
                                  Pageable pageable);

    @EntityGraph(attributePaths = {"project", "project.owner"})
    @Query("select s from Student s where s.id = :id")
    Optional<Student> findWithProjectById(@Param("id") Long id);

    // ---- dashboard -------------------------------------------------------------------------

    @Query("select count(s) from Student s where s.project.owner.id = :ownerId")
    long countByOwner(@Param("ownerId") Long ownerId);

    @Query("""
            select new com.edis.backendproject.dto.DashboardResponse$DailyCount(cast(s.createdAt as LocalDate), count(s))
            from Student s
            where s.createdAt >= :since
            group by cast(s.createdAt as LocalDate)
            """)
    List<DashboardResponse.DailyCount> dailyAdditions(@Param("since") LocalDateTime since);

    @Query("""
            select new com.edis.backendproject.dto.DashboardResponse$DailyCount(cast(s.createdAt as LocalDate), count(s))
            from Student s
            where s.project.owner.id = :ownerId and s.createdAt >= :since
            group by cast(s.createdAt as LocalDate)
            """)
    List<DashboardResponse.DailyCount> dailyAdditionsByOwner(@Param("ownerId") Long ownerId,
                                                             @Param("since") LocalDateTime since);

    @EntityGraph(attributePaths = "project")
    @Query("select s from Student s")
    List<Student> findRecent(Pageable pageable);

    @EntityGraph(attributePaths = "project")
    @Query("select s from Student s where s.project.owner.id = :ownerId")
    List<Student> findRecentByOwner(@Param("ownerId") Long ownerId, Pageable pageable);

    boolean existsByProjectIdAndCodeNumber(Long projectId, String codeNumber);

    boolean existsByProjectIdAndCodeNumberAndIdNot(Long projectId, String codeNumber, Long id);
}
