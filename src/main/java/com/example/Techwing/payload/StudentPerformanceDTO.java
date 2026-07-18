package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPerformanceDTO {
    private Long userId;
    private String name;
    private String email;
    private String pinNumber;
    private Integer year;
    private String branch;
    private String college;
    
    private Long latestSessionId;
    private String trackName;
    private Double overallScore;
    private LocalDateTime interviewDate;
}
