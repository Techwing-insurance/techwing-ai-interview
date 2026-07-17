package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerEvalResponse {
    private String transcript;
    private boolean evaluated;
    private Double score;
    private String feedback;
    private boolean nextAvailable;
    private Integer questionsRemaining;
}
