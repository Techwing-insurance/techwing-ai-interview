package com.example.Techwing.controller;

import com.example.Techwing.models.Resume;
import com.example.Techwing.models.ResumeAnalysis;
import com.example.Techwing.models.User;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.service.AuthService;
import com.example.Techwing.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final AuthService authService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Resume>> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Resume resume = resumeService.uploadResume(user.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Resume uploaded successfully", resume));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<String>> getStatus(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Resume resume = resumeService.getResumeByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(resume.getStatus().name()));
    }

    @GetMapping("/analysis")
    public ResponseEntity<ApiResponse<ResumeAnalysis>> getAnalysis(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        ResumeAnalysis analysis = resumeService.getAnalysisByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(analysis));
    }

    @GetMapping("/preview")
    public ResponseEntity<ApiResponse<String>> getPreview(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        String url = resumeService.getResumePreviewUrl(user.getId());
        return ResponseEntity.ok(ApiResponse.success(url));
    }
}
