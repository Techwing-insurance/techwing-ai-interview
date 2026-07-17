package com.example.Techwing.service.implementation;

import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.payload.ReportResponse;
import com.example.Techwing.repository.*;
import com.example.Techwing.service.NotificationService;
import com.example.Techwing.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportServiceImpl implements ReportService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewReportRepository reportRepository;
    private final LearningRoadmapRepository roadmapRepository;
    private final TechnicalAnswerRepository technicalAnswerRepository;
    private final HRAnswerRepository hrAnswerRepository;
    private final CodingSubmissionRepository submissionRepository;
    private final NotificationService notificationService;

    @Override
    @Async
    public void generateReport(Long sessionId) {
        log.info("Generating report for session: {}", sessionId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        session.setStatus(SessionStatus.EVALUATING);
        sessionRepository.save(session);

        // Calculate scores
        Double technicalScore = technicalAnswerRepository.findAverageScoreBySessionId(sessionId);
        Double hrScore = hrAnswerRepository.findAverageHRScoreBySessionId(sessionId);
        double techScore = technicalScore != null ? technicalScore * 10 : 0;
        double codingScore = session.getCodingScore() != null ? session.getCodingScore() : 0;
        double hrFinalScore = hrScore != null ? hrScore * 10 : 0;

        // Weighted overall: Technical 40%, Coding 35%, HR 25%
        double overallScore = (techScore * 0.40) + (codingScore * 0.35) + (hrFinalScore * 0.25);

        Recommendation recommendation;
        if (overallScore >= 85) recommendation = Recommendation.STRONGLY_RECOMMENDED;
        else if (overallScore >= 70) recommendation = Recommendation.RECOMMENDED;
        else if (overallScore >= 55) recommendation = Recommendation.BORDERLINE;
        else recommendation = Recommendation.NOT_RECOMMENDED;

        // Build report
        String strengths = "[\"Strong core Java fundamentals\",\"Good REST API understanding\",\"Clear communication\"]";
        String weaknesses = "[\"AWS knowledge needs improvement\",\"Binary Trees\",\"Dynamic Programming\"]";
        String aiSummary = String.format(
            "Candidate demonstrates %s overall performance with a score of %.1f/100. %s for this role.",
            overallScore >= 70 ? "strong" : "moderate",
            overallScore,
            recommendation == Recommendation.RECOMMENDED || recommendation == Recommendation.STRONGLY_RECOMMENDED
                ? "Recommended" : "Not recommended"
        );
        String pdfUrl = "https://techwings-reports.s3.amazonaws.com/" + sessionId + "/report.pdf";

        InterviewReport report = InterviewReport.builder()
                .session(session)
                .user(session.getUser())
                .technicalScore(techScore)
                .codingScore(codingScore)
                .hrScore(hrFinalScore)
                .overallScore(overallScore)
                .recommendation(recommendation)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .technicalBreakdown("{\"Java\":9,\"Spring Boot\":8,\"Database\":7,\"REST APIs\":9}")
                .hrBreakdown("{\"Communication\":9,\"Confidence\":8,\"Leadership\":7}")
                .aiSummary(aiSummary)
                .pdfS3Url(pdfUrl)
                .build();
        reportRepository.save(report);

        // Generate roadmap
        String roadmapJson = "{\"priority_topics\":[\"Redis\",\"Docker\",\"Graphs\",\"Dynamic Programming\"]," +
                "\"weeks\":[{\"week\":1,\"focus\":\"Dynamic Programming\",\"topics\":[\"Memoization\",\"Tabulation\"]}," +
                "{\"week\":2,\"focus\":\"System Design Basics\",\"topics\":[\"Redis\",\"Caching\"]}]," +
                "\"estimated_duration_weeks\":8}";
        LearningRoadmap roadmap = LearningRoadmap.builder()
                .session(session)
                .user(session.getUser())
                .roadmapJson(roadmapJson)
                .build();
        roadmapRepository.save(roadmap);

        session.setOverallScore(overallScore);
        session.setRecommendation(recommendation);
        session.setStatus(SessionStatus.COMPLETED);
        sessionRepository.save(session);

        // Send notification email
        notificationService.sendReportReadyEmail(session.getUser().getId(), sessionId);
        log.info("Report generated for session: {} overallScore: {}", sessionId, overallScore);
    }

    @Override
    public ReportResponse getReport(Long sessionId) {
        InterviewReport report = reportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "sessionId", sessionId));
        return mapToResponse(report);
    }

    @Override
    public String getReportDownloadUrl(Long sessionId) {
        InterviewReport report = reportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "sessionId", sessionId));
        return report.getPdfS3Url() + "?presigned=true&expiry=3600";
    }

    @Override
    public LearningRoadmap getRoadmap(Long sessionId) {
        return roadmapRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Roadmap", "sessionId", sessionId));
    }

    @Override
    public List<ReportResponse> getMyReports(Long userId) {
        return reportRepository.findByUserIdOrderByGeneratedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ReportResponse mapToResponse(InterviewReport r) {
        return ReportResponse.builder()
                .sessionId(r.getSession().getId())
                .candidateName(r.getUser().getName())
                .email(r.getUser().getEmail())
                .track(r.getSession().getTrack().getName())
                .technicalScore(r.getTechnicalScore())
                .codingScore(r.getCodingScore())
                .hrScore(r.getHrScore())
                .overallScore(r.getOverallScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .technicalBreakdown(r.getTechnicalBreakdown())
                .codingBreakdown(r.getCodingBreakdown())
                .hrBreakdown(r.getHrBreakdown())
                .strengths(r.getStrengths())
                .weaknesses(r.getWeaknesses())
                .aiSummary(r.getAiSummary())
                .pdfS3Url(r.getPdfS3Url())
                .generatedAt(r.getGeneratedAt() != null ? r.getGeneratedAt().toString() : null)
                .build();
    }
}
