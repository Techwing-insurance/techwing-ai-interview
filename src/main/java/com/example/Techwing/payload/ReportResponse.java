package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long sessionId;
    private String candidateName;
    private String email;
    private String track;
    private Double technicalScore;
    private Double hrScore;
    private Double overallScore;
    private String recommendation;
    private String technicalBreakdown;
    private String hrBreakdown;
    private String strengths;
    private String weaknesses;
    private String aiSummary;
    private String pdfS3Url;
    private String generatedAt;
}
