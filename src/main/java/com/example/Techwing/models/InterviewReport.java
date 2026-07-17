package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    @ToString.Exclude
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "coding_score")
    private Double codingScore;

    @Column(name = "hr_score")
    private Double hrScore;

    @Column(name = "overall_score")
    private Double overallScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Recommendation recommendation;

    @Column(columnDefinition = "JSON")
    private String strengths;

    @Column(columnDefinition = "JSON")
    private String weaknesses;

    @Column(name = "technical_breakdown", columnDefinition = "JSON")
    private String technicalBreakdown;

    @Column(name = "hr_breakdown", columnDefinition = "JSON")
    private String hrBreakdown;

    @Column(name = "coding_breakdown", columnDefinition = "JSON")
    private String codingBreakdown;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "pdf_s3_url", length = 1000)
    private String pdfS3Url;

    @Column(name = "email_sent")
    @Builder.Default
    private Boolean emailSent = false;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;
}
