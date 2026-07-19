package com.example.Techwing.controller;

import com.example.Techwing.models.User;
import com.example.Techwing.payload.*;
import com.example.Techwing.service.AuthService;
import com.example.Techwing.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final AuthService authService;

    // ─── TECHNICAL ────────────────────────────────────────────────────────────

    @PostMapping("/technical/start")
    public ResponseEntity<ApiResponse<InterviewStartResponse>> startTechnical(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        InterviewStartResponse response = interviewService.startTechnicalRound(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Technical round started", response));
    }

    @PostMapping("/technical/answer")
    public ResponseEntity<ApiResponse<AnswerEvalResponse>> submitTechnicalAnswer(
            @Valid @RequestBody AnswerRequest request) {
        AnswerEvalResponse response = interviewService.submitTechnicalAnswer(request);
        return ResponseEntity.ok(ApiResponse.success("Answer submitted", response));
    }

    @GetMapping("/technical/next")
    public ResponseEntity<ApiResponse<QuestionResponse>> getNextTechnical(@RequestParam Long sessionId) {
        QuestionResponse response = interviewService.getNextTechnicalQuestion(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/technical/complete")
    public ResponseEntity<ApiResponse<String>> completeTechnical(@RequestParam Long sessionId) {
        interviewService.completeTechnicalRound(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Technical round completed", null));
    }

    // ─── HR ───────────────────────────────────────────────────────────────────

    @PostMapping("/hr/start")
    public ResponseEntity<ApiResponse<InterviewStartResponse>> startHR(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        InterviewStartResponse response = interviewService.startHRRound(user.getId());
        return ResponseEntity.ok(ApiResponse.success("HR round started", response));
    }

    @PostMapping("/hr/answer")
    public ResponseEntity<ApiResponse<AnswerEvalResponse>> submitHRAnswer(
            @Valid @RequestBody AnswerRequest request) {
        AnswerEvalResponse response = interviewService.submitHRAnswer(request);
        return ResponseEntity.ok(ApiResponse.success("HR answer submitted", response));
    }

    @GetMapping("/hr/next")
    public ResponseEntity<ApiResponse<QuestionResponse>> getNextHR(@RequestParam Long sessionId) {
        QuestionResponse response = interviewService.getNextHRQuestion(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/hr/complete")
    public ResponseEntity<ApiResponse<String>> completeHR(@RequestParam Long sessionId) {
        interviewService.completeHRRound(sessionId);
        return ResponseEntity.ok(ApiResponse.success("HR round completed", null));
    }

    // ─── FEEDBACK ─────────────────────────────────────────────────────────────

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<String>> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        interviewService.submitFeedback(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully", null));
    }
}
