package com.example.Techwing.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @ToString.Exclude
    private User user;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    @ToString.Exclude
    private byte[] fileData;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size_kb")
    private Integer fileSizeKb;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ResumeStatus status = ResumeStatus.UPLOADED;

    @Column(name = "uploaded_at")
    @CreationTimestamp
    private LocalDateTime uploadedAt;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;
}