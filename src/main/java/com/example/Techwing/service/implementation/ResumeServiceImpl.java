package com.example.Techwing.service.implementation;

import com.example.Techwing.exception.FileUploadException;
import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.repository.*;
import com.example.Techwing.service.AIClientService;
import com.example.Techwing.service.ResumeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ResumeServiceImpl implements ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final UserRepository userRepository;
    private final AIClientService aiClientService;
    private final ObjectMapper objectMapper;

    @Override
    public Resume uploadResume(Long userId, MultipartFile file) {
        if (file.isEmpty()) throw new FileUploadException("File is empty");
        if (!Objects.equals(file.getContentType(), "application/pdf"))
            throw new FileUploadException("Only PDF files are allowed");
        if (file.getSize() > 5 * 1024 * 1024)
            throw new FileUploadException("File size must not exceed 5MB");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // TODO: Upload to AWS S3 in production
        String s3Url = "https://techwings-resumes.s3.amazonaws.com/" + userId + "/" + file.getOriginalFilename();

        Resume resume;
        if (resumeRepository.existsByUserId(userId)) {
            resume = resumeRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resume", "userId", userId));
            resume.setS3Url(s3Url);
            resume.setFileName(file.getOriginalFilename());
            resume.setFileSizeKb((int)(file.getSize() / 1024));
            resume.setStatus(ResumeStatus.UPLOADED);
            resume.setAnalyzedAt(null);
            resumeAnalysisRepository.findByUserId(userId).ifPresent(a -> resumeAnalysisRepository.delete(a));
        } else {
            resume = Resume.builder()
                    .user(user)
                    .s3Url(s3Url)
                    .fileName(file.getOriginalFilename())
                    .fileSizeKb((int)(file.getSize() / 1024))
                    .status(ResumeStatus.UPLOADED)
                    .build();
        }
        resume = resumeRepository.save(resume);
        log.info("Resume uploaded for user: {} → {}", userId, s3Url);
        triggerAnalysis(resume.getId());
        return resume;
    }

    @Override
    @Async
    public void triggerAnalysis(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        try {
            resume.setStatus(ResumeStatus.ANALYZING);
            resumeRepository.save(resume);

            // ── Call Python AI Service ─────────────────────────────────────────
            JsonNode aiResult = aiClientService.analyzeResume(
                    resume.getS3Url(),
                    resume.getUser().getId(),
                    resume.getUser().getName()
            );

            String skills, projects, education, certifications, summary;
            double experienceYears;

            if (aiResult != null && aiResult.has("skills")) {
                skills         = aiResult.get("skills").toString();
                projects       = aiResult.has("projects")       ? aiResult.get("projects").toString()       : "[]";
                education      = aiResult.has("education")      ? aiResult.get("education").toString()      : "[]";
                certifications = aiResult.has("certifications") ? aiResult.get("certifications").toString() : "[]";
                experienceYears= aiResult.has("experience_years")? aiResult.get("experience_years").asDouble(0.0): 0.0;
                summary        = aiResult.has("summary")        ? aiResult.get("summary").asText("") : "";
            } else {
                // Fallback mock
                log.warn("AI service returned null, using fallback for resumeId: {}", resumeId);
                skills         = "[\"Java\",\"Spring Boot\",\"MySQL\",\"React\"]";
                projects       = "[{\"name\":\"AI Interview Platform\",\"description\":\"Final Year Project\",\"tech_stack\":[\"Java\",\"React\"]}]";
                education      = "[{\"degree\":\"B.Tech CSE\",\"institution\":\"ABC Engineering\",\"year\":2025}]";
                certifications = "[]";
                experienceYears= 0.5;
                summary        = "Final year CSE student with Java and Spring Boot background.";
            }

            ResumeAnalysis analysis = ResumeAnalysis.builder()
                    .resume(resume)
                    .user(resume.getUser())
                    .skills(skills)
                    .projects(projects)
                    .education(education)
                    .certifications(certifications)
                    .experienceYears(experienceYears)
                    .summary(summary)
                    .aiRawResponse(aiResult != null ? aiResult.toString() : null)
                    .build();

            resumeAnalysisRepository.save(analysis);
            resume.setStatus(ResumeStatus.ANALYZED);
            resume.setAnalyzedAt(LocalDateTime.now());
            resumeRepository.save(resume);
            log.info("Resume analysis completed for resumeId: {}", resumeId);
        } catch (Exception e) {
            log.error("Resume analysis failed for resumeId: {}", resumeId, e);
            resume.setStatus(ResumeStatus.FAILED);
            resumeRepository.save(resume);
        }
    }

    @Override
    public Resume getResumeByUserId(Long userId) {
        return resumeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "userId", userId));
    }

    @Override
    public ResumeAnalysis getAnalysisByUserId(Long userId) {
        return resumeAnalysisRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("ResumeAnalysis", "userId", userId));
    }

    @Override
    public String getResumePreviewUrl(Long userId) {
        Resume resume = getResumeByUserId(userId);
        return resume.getS3Url() + "?presigned=true&expiry=3600";
    }
}
