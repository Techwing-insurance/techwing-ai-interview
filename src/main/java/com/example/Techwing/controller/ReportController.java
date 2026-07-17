package com.example.Techwing.controller;

import com.example.Techwing.models.LearningRoadmap;
import com.example.Techwing.models.User;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.payload.ReportResponse;
import com.example.Techwing.service.AuthService;
import com.example.Techwing.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/report")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuthService authService;

    @PostMapping("/generate/{sessionId}")
    public ResponseEntity<ApiResponse<String>> generate(@PathVariable Long sessionId) {
        reportService.generateReport(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Report generation triggered", null));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReport(sessionId)));
    }

    @GetMapping("/{sessionId}/download")
    public ResponseEntity<ApiResponse<String>> download(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReportDownloadUrl(sessionId)));
    }

    @GetMapping("/{sessionId}/roadmap")
    public ResponseEntity<ApiResponse<LearningRoadmap>> getRoadmap(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getRoadmap(sessionId)));
    }

    @GetMapping("/my-reports")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> myReports(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(reportService.getMyReports(user.getId())));
    }
}
