package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "technical_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicalAnswer {

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
    private TechnicalQuestion question;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(name = "audio_s3_url", length = 1000)
    private String audioS3Url;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(precision = 4)
    private Double score;

    @Column(name = "accuracy_score")
    private Double accuracyScore;

    @Column(name = "depth_score")
    private Double depthScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
