package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    @ToString.Exclude
    private TechnologyTrack track;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "sample_input", columnDefinition = "TEXT")
    private String sampleInput;

    @Column(name = "sample_output", columnDefinition = "TEXT")
    private String sampleOutput;

    @Column(name = "hidden_test_cases", columnDefinition = "JSON")
    private String hiddenTestCases;

    @Column(name = "time_limit_ms")
    @Builder.Default
    private Integer timeLimitMs = 2000;

    @Column(name = "memory_limit_mb")
    @Builder.Default
    private Integer memoryLimitMb = 256;

    @Column(columnDefinition = "JSON")
    private String tags;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
