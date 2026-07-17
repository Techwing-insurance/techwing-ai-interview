package com.example.Techwing.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {
    private Long questionId;
    private Integer order;
    private String questionText;
    private String category;
    private String difficulty;
    private boolean hasNext;
    private Integer totalQuestions;
}
