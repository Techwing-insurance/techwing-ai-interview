package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    @ToString.Exclude
    private TechnologyTrack track;

    @Column(name = "technical_question_count", nullable = false)
    @Builder.Default
    private Integer technicalQuestionCount = 15;

    @Column(name = "technical_time_minutes", nullable = false)
    @Builder.Default
    private Integer technicalTimeMinutes = 25;

    @Column(name = "coding_problem_count", nullable = false)
    @Builder.Default
    private Integer codingProblemCount = 2;

    @Column(name = "coding_time_minutes", nullable = false)
    @Builder.Default
    private Integer codingTimeMinutes = 60;

    @Column(name = "hr_question_count", nullable = false)
    @Builder.Default
    private Integer hrQuestionCount = 8;

    @Column(name = "hr_time_minutes", nullable = false)
    @Builder.Default
    private Integer hrTimeMinutes = 15;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
