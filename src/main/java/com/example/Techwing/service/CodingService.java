package com.example.Techwing.service;

import com.example.Techwing.models.CodingProblem;
import com.example.Techwing.payload.CodeRunRequest;
import com.example.Techwing.payload.CodeRunResponse;
import java.util.List;

public interface CodingService {
    List<CodingProblem> startCodingRound(Long userId);
    CodingProblem getProblemById(Long problemId);
    CodeRunResponse runCode(CodeRunRequest request);
    CodeRunResponse submitCode(CodeRunRequest request);
    void completeCodingRound(Long sessionId);
}
