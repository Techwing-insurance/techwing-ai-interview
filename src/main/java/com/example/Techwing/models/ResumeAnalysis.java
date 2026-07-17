package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "resume_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @ToString.Exclude
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(columnDefinition = "JSON")
    private String skills;

    @Column(columnDefinition = "JSON")
    private String projects;

    @Column(columnDefinition = "JSON")
    private String education;

    @Column(columnDefinition = "JSON")
    private String certifications;

    @Column(name = "experience_years")
    private Double experienceYears;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "ai_raw_response", columnDefinition = "TEXT")
    private String aiRawResponse;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
