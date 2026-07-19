package com.example.Techwing.payload;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReportSummaryDTO {
    private Long id;
    private Double technicalScore;
    private Double hrScore;
    private Double overallScore;
    private String recommendation;
    private String aiSummary;
    private LocalDateTime generatedAt;
}
