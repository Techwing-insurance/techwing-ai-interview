package com.example.Techwing.payload;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerRequest {
    @NotNull private Long sessionId;
    @NotNull private Integer questionOrder;
    private String transcript;
    private String audioS3Url;
}
