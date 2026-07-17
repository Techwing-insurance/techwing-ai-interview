package com.example.Techwing.service;

import com.example.Techwing.payload.AnswerEvalResponse;
import com.example.Techwing.payload.AnswerRequest;
import com.example.Techwing.payload.InterviewStartResponse;
import com.example.Techwing.payload.QuestionResponse;

public interface InterviewService {
    // Technical
    InterviewStartResponse startTechnicalRound(Long userId);
    AnswerEvalResponse submitTechnicalAnswer(AnswerRequest request);
    QuestionResponse getNextTechnicalQuestion(Long sessionId);
    void completeTechnicalRound(Long sessionId);

    // HR
    InterviewStartResponse startHRRound(Long userId);
    AnswerEvalResponse submitHRAnswer(AnswerRequest request);
    QuestionResponse getNextHRQuestion(Long sessionId);
    void completeHRRound(Long sessionId);
}
