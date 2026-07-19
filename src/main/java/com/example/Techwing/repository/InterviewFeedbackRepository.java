package com.example.Techwing.repository;

import com.example.Techwing.models.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {
    Optional<InterviewFeedback> findBySessionId(Long sessionId);
    List<InterviewFeedback> findByUserId(Long userId);
}
