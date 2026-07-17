package com.example.Techwing.repository;

import com.example.Techwing.models.CodingProblem;
import com.example.Techwing.models.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CodingProblemRepository extends JpaRepository<CodingProblem, Long> {
    List<CodingProblem> findByTrackIdAndIsActiveTrue(Long trackId);
    List<CodingProblem> findByTrackIdAndDifficultyAndIsActiveTrue(Long trackId, Difficulty difficulty);
    long countByTrackId(Long trackId);
}
