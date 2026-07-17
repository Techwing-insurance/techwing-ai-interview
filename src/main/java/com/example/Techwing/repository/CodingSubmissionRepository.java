package com.example.Techwing.repository;

import com.example.Techwing.models.CodingSubmission;
import com.example.Techwing.models.SubmissionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, Long> {
    List<CodingSubmission> findBySessionId(Long sessionId);
    List<CodingSubmission> findBySessionIdAndSubmissionType(Long sessionId, SubmissionType type);
    Optional<CodingSubmission> findTopBySessionIdAndProblemIdAndSubmissionTypeOrderBySubmittedAtDesc(
            Long sessionId, Long problemId, SubmissionType type);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM CodingSubmission s WHERE s.session.id = :sessionId AND s.submissionType = 'SUBMIT'")
    long countDistinctProblemsSubmitted(Long sessionId);
}
