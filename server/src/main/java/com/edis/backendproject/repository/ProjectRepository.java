package com.edis.backendproject.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edis.backendproject.model.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    /** All projects whose name or description matches the (already lower-cased, escaped) LIKE pattern. */
    @EntityGraph(attributePaths = "owner")
    @Query("""
            select p from Project p
            where lower(p.name) like :pattern escape '\\'
               or lower(coalesce(p.description, '')) like :pattern escape '\\'
            """)
    Page<Project> search(@Param("pattern") String pattern, Pageable pageable);

    /** Same as {@link #search} but limited to one owner. */
    @EntityGraph(attributePaths = "owner")
    @Query("""
            select p from Project p
            where p.owner.id = :ownerId
              and (lower(p.name) like :pattern escape '\\'
                   or lower(coalesce(p.description, '')) like :pattern escape '\\')
            """)
    Page<Project> searchByOwner(@Param("ownerId") Long ownerId, @Param("pattern") String pattern, Pageable pageable);

    @EntityGraph(attributePaths = "owner")
    @Query("select p from Project p where p.id = :id")
    Optional<Project> findWithOwnerById(@Param("id") Long id);

    long countByOwnerId(Long ownerId);

    boolean existsByOwnerIdAndNameIgnoreCase(Long ownerId, String name);

    boolean existsByOwnerIdAndNameIgnoreCaseAndIdNot(Long ownerId, String name, Long id);
}
