package com.example.Techwing.service;

import com.example.Techwing.models.Resume;
import com.example.Techwing.models.ResumeAnalysis;
import org.springframework.web.multipart.MultipartFile;

public interface ResumeService {
    Resume uploadResume(Long userId, MultipartFile file);
    Resume getResumeByUserId(Long userId);
    ResumeAnalysis getAnalysisByUserId(Long userId);
    String getResumePreviewUrl(Long userId);
    void triggerAnalysis(Long resumeId);
}
