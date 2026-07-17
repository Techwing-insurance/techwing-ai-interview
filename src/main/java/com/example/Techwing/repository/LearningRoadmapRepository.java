package com.example.Techwing.repository;

import com.example.Techwing.models.LearningRoadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LearningRoadmapRepository extends JpaRepository<LearningRoadmap, Long> {
    Optional<LearningRoadmap> findBySessionId(Long sessionId);
    Optional<LearningRoadmap> findByUserId(Long userId);
}
