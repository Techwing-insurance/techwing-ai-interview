package com.example.Techwing.payload;

import lombok.Data;

@Data
public class FeedbackRequest {
    private Long sessionId;
    private String feedbackText;
    private Integer rating;
}
