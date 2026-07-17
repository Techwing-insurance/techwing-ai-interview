package com.example.Techwing.payload;

import com.example.Techwing.models.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRunResponse {
    private Long submissionId;
    private SubmissionStatus status;
    private Integer passedCases;
    private Integer totalCases;
    private Integer executionTimeMs;
    private Integer memoryMb;
    private String stdout;
    private String stderr;
    private String aiFeedback;
    private Integer score;
}
