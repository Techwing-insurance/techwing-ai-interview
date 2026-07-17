package com.example.Techwing.controller;

import com.example.Techwing.models.User;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.payload.DashboardResponse;
import com.example.Techwing.repository.InterviewSessionRepository;
import com.example.Techwing.repository.ResumeRepository;
import com.example.Techwing.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final AuthService authService;
    private final InterviewSessionRepository sessionRepository;
    private final ResumeRepository resumeRepository;

    @GetMapping("/student")
    public ResponseEntity<ApiResponse<DashboardResponse>> studentDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String resumeStatus = resumeRepository.findByUserId(user.getId())
                .map(r -> r.getStatus().name()).orElse("NOT_UPLOADED");
        var session = sessionRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());
        long completed = sessionRepository.countCompletedByUserId(user.getId());

        return ResponseEntity.ok(ApiResponse.success(DashboardResponse.builder()
                .candidateName(user.getName())
                .resumeStatus(resumeStatus)
                .currentSessionId(session.map(s -> s.getId()).orElse(null))
                .currentSessionStatus(session.map(s -> s.getStatus().name()).orElse(null))
                .completedSessions(completed)
                .latestScore(session.map(s -> s.getOverallScore()).orElse(null))
                .latestRecommendation(session
                        .filter(s -> s.getRecommendation() != null)
                        .map(s -> s.getRecommendation().name()).orElse(null))
                .build()));
    }
}
