package com.example.Techwing.payload;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class StudentProfileDTO {
    private Long userId;
    private String name;
    private String email;
    private String pinNumber;
    private String year;
    private String branch;
    private String college;
    
    private Integer totalInterviews;
    private Double averageOverallScore;
    
    private List<ReportSummaryDTO> pastReports;
}
