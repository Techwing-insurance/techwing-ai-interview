package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    @ToString.Exclude
    private CodingProblem problem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private ProgrammingLanguage language = ProgrammingLanguage.JAVA;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_type", nullable = false, length = 10)
    private SubmissionType submissionType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @Column(name = "total_test_cases")
    private Integer totalTestCases;

    @Column(name = "passed_test_cases")
    private Integer passedTestCases;

    @Column(name = "execution_time_ms")
    private Integer executionTimeMs;

    @Column(name = "memory_used_mb")
    private Integer memoryUsedMb;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;
}
