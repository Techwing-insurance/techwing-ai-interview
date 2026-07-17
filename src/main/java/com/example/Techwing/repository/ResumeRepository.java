package com.example.Techwing.repository;

import com.example.Techwing.models.Resume;
import com.example.Techwing.models.ResumeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    long countByStatus(ResumeStatus status);
}
