package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "hr_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HRAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @ToString.Exclude
    private HRQuestion question;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(name = "audio_s3_url", length = 1000)
    private String audioS3Url;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "fluency_score")
    private Double fluencyScore;

    @Column(name = "grammar_score")
    private Double grammarScore;

    @Column(name = "leadership_score")
    private Double leadershipScore;

    @Column(name = "positivity_score")
    private Double positivityScore;

    @Column(name = "professionalism_score")
    private Double professionalismScore;

    @Column(name = "overall_hr_score")
    private Double overallHrScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
