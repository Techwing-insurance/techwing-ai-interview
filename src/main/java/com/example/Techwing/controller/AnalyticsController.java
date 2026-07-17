package com.example.Techwing.controller;

import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> overview() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPlatformOverview()));
    }

    @GetMapping("/track/{trackId}")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> track(@PathVariable Long trackId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTrackAnalytics(trackId)));
    }

    @GetMapping("/leaderboard")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> leaderboard() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getLeaderboard()));
    }

    @GetMapping("/student/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> student(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getStudentAnalytics(userId)));
    }
}
