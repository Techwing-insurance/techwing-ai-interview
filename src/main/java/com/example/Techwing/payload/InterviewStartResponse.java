package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewStartResponse {
    private Long sessionId;
    private Integer totalQuestions;
    private Integer timeLimitMinutes;
    private Long questionId;
    private Integer questionOrder;
    private String questionText;
    private String category;
    private String difficulty;
}
