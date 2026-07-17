package com.example.Techwing.payload;

import com.example.Techwing.models.ProgrammingLanguage;
import com.example.Techwing.models.SubmissionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CodeRunRequest {
    @NotNull private Long sessionId;
    @NotNull private Long problemId;
    @NotNull private ProgrammingLanguage language;
    @NotBlank private String code;
    @NotNull private SubmissionType submissionType;
}
