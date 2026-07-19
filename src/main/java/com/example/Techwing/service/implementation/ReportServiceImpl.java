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
    private final NotificationService notificationService;

    @Override
    @Async
    public void generateReport(Long sessionId) {
        log.info("Generating report for session: {}", sessionId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        session.setStatus(SessionStatus.EVALUATING);
        sessionRepository.save(session);

        // ─── Fetch real answers from DB ───────────────────────────────────────
        List<TechnicalAnswer> techAnswers = technicalAnswerRepository.findBySessionIdOrderByQuestionOrder(sessionId);
        List<HRAnswer> hrAnswers = hrAnswerRepository.findBySessionIdOrderByQuestionOrder(sessionId);

        // Technical overall score: average of all AI-scored answers (1-10 scale)
        double techScore = techAnswers.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(TechnicalAnswer::getScore)
                .average().orElse(0.0);

        // HR overall score: average of overall_hr_score per answer (1-10 scale)
        double hrFinalScore = hrAnswers.stream()
                .filter(a -> a.getOverallHrScore() != null)
                .mapToDouble(HRAnswer::getOverallHrScore)
                .average().orElse(0.0);

        // Weighted overall: Technical 60%, HR 40%
        double overallScore = (techScore * 0.60) + (hrFinalScore * 0.40);

        // Recommendation thresholds (0-10 scale)
        Recommendation recommendation;
        if (overallScore >= 8.5)      recommendation = Recommendation.STRONGLY_RECOMMENDED;
        else if (overallScore >= 7.0) recommendation = Recommendation.RECOMMENDED;
        else if (overallScore >= 5.5) recommendation = Recommendation.BORDERLINE;
        else                          recommendation = Recommendation.NOT_RECOMMENDED;

        // ─── Technical Breakdown — real per-dimension averages ────────────────
        double avgAccuracy = techAnswers.stream()
                .filter(a -> a.getAccuracyScore() != null)
                .mapToDouble(TechnicalAnswer::getAccuracyScore).average().orElse(techScore);
        double avgDepth = techAnswers.stream()
                .filter(a -> a.getDepthScore() != null)
                .mapToDouble(TechnicalAnswer::getDepthScore).average().orElse(techScore);
        double avgTechComm = techAnswers.stream()
                .filter(a -> a.getCommunicationScore() != null)
                .mapToDouble(TechnicalAnswer::getCommunicationScore).average().orElse(techScore);

        String technicalBreakdown = String.format(
                "{\"Overall\":%.1f,\"Accuracy\":%.1f,\"Depth\":%.1f,\"Communication\":%.1f}",
                techScore, avgAccuracy, avgDepth, avgTechComm);

        // ─── HR Breakdown — real 7-dimension averages ─────────────────────────
        double avgConfidence      = hrAnswers.stream().filter(a -> a.getConfidenceScore() != null)
                .mapToDouble(HRAnswer::getConfidenceScore).average().orElse(hrFinalScore);
        double avgHRComm          = hrAnswers.stream().filter(a -> a.getCommunicationScore() != null)
                .mapToDouble(HRAnswer::getCommunicationScore).average().orElse(hrFinalScore);
        double avgFluency         = hrAnswers.stream().filter(a -> a.getFluencyScore() != null)
                .mapToDouble(HRAnswer::getFluencyScore).average().orElse(hrFinalScore);
        double avgGrammar         = hrAnswers.stream().filter(a -> a.getGrammarScore() != null)
                .mapToDouble(HRAnswer::getGrammarScore).average().orElse(hrFinalScore);
        double avgLeadership      = hrAnswers.stream().filter(a -> a.getLeadershipScore() != null)
                .mapToDouble(HRAnswer::getLeadershipScore).average().orElse(hrFinalScore);
        double avgPositivity      = hrAnswers.stream().filter(a -> a.getPositivityScore() != null)
                .mapToDouble(HRAnswer::getPositivityScore).average().orElse(hrFinalScore);
        double avgProfessionalism = hrAnswers.stream().filter(a -> a.getProfessionalismScore() != null)
                .mapToDouble(HRAnswer::getProfessionalismScore).average().orElse(hrFinalScore);

        String hrBreakdown = String.format(
                "{\"Confidence\":%.1f,\"Communication\":%.1f,\"Fluency\":%.1f," +
                "\"Grammar\":%.1f,\"Leadership\":%.1f,\"Positivity\":%.1f,\"Professionalism\":%.1f}",
                avgConfidence, avgHRComm, avgFluency, avgGrammar,
                avgLeadership, avgPositivity, avgProfessionalism);

        // ─── Dynamic Strengths & Weaknesses from real scores ─────────────────
        java.util.List<String> strengthsList = new java.util.ArrayList<>();
        java.util.List<String> weaknessesList = new java.util.ArrayList<>();

        if (techScore >= 7.5)       strengthsList.add("Strong technical knowledge and problem-solving ability");
        else if (techScore >= 5.5)  strengthsList.add("Solid foundational understanding of technical concepts");
        else                        weaknessesList.add("Technical fundamentals need significant improvement");

        if (avgDepth >= 7.0)        strengthsList.add("Demonstrates depth of understanding in key technical areas");
        else                        weaknessesList.add("Needs to develop deeper knowledge of advanced topics");

        if (avgTechComm >= 7.0)     strengthsList.add("Explains technical concepts clearly and concisely");
        else                        weaknessesList.add("Practice explaining technical concepts more clearly");

        if (avgConfidence >= 7.0)   strengthsList.add("Communicates with confidence and professionalism");
        else                        weaknessesList.add("Build more confidence when presenting responses");

        if (avgHRComm >= 7.0)       strengthsList.add("Excellent verbal communication and articulation skills");
        else                        weaknessesList.add("Focus on improving verbal clarity and sentence structure");

        if (avgLeadership >= 7.0)   strengthsList.add("Shows initiative, ownership, and leadership qualities");
        else                        weaknessesList.add("Provide more specific examples of leadership and teamwork");

        if (avgFluency >= 7.0)      strengthsList.add("Speaks fluently with minimal hesitation or filler words");
        else                        weaknessesList.add("Practice to reduce filler words and speak more fluently");

        if (strengthsList.isEmpty())
            strengthsList.add("Completed the full interview demonstrating commitment and effort");
        if (weaknessesList.isEmpty())
            weaknessesList.add("Continue practicing to maintain this excellent level of performance");

        String strengthsJson = strengthsList.stream()
                .map(s -> "\"" + s.replace("\"", "'") + "\"")
                .collect(Collectors.joining(",", "[", "]"));
        String weaknessesJson = weaknessesList.stream()
                .map(w -> "\"" + w.replace("\"", "'") + "\"")
                .collect(Collectors.joining(",", "[", "]"));

        // ─── AI Summary with real counts and scores ───────────────────────────
        long techAnswered = techAnswers.stream().filter(a -> a.getTranscript() != null).count();
        long hrAnswered   = hrAnswers.stream().filter(a -> a.getTranscript() != null).count();
        String aiSummary = String.format(
            "Candidate answered %d technical questions (avg %.1f/10) and %d HR questions (avg %.1f/10), " +
            "achieving an overall score of %.1f/10. %s for this role based on demonstrated %s performance.",
            techAnswered, techScore, hrAnswered, hrFinalScore, overallScore,
            (recommendation == Recommendation.RECOMMENDED || recommendation == Recommendation.STRONGLY_RECOMMENDED)
                ? "Recommended" : "Not recommended at this time",
            overallScore >= 7.0 ? "strong" : overallScore >= 5.5 ? "satisfactory" : "developing");

        String pdfUrl = "https://techwings-reports.s3.amazonaws.com/" + sessionId + "/report.pdf";

        // ─── Save Report (upsert to handle retries safely) ───────────────────
        InterviewReport report = reportRepository.findBySessionId(sessionId)
                .orElse(InterviewReport.builder().session(session).user(session.getUser()).build());
        report.setTechnicalScore(techScore);
        report.setHrScore(hrFinalScore);
        report.setOverallScore(overallScore);
        report.setRecommendation(recommendation);
        report.setStrengths(strengthsJson);
        report.setWeaknesses(weaknessesJson);
        report.setTechnicalBreakdown(technicalBreakdown);
        report.setHrBreakdown(hrBreakdown);
        report.setAiSummary(aiSummary);
        report.setPdfS3Url(pdfUrl);
        reportRepository.save(report);

        // ─── Learning Roadmap based on weakest areas ──────────────────────────
        java.util.List<String> priorityTopics = new java.util.ArrayList<>();
        if (avgDepth < 7.0)           priorityTopics.add("System Design & Architecture");
        if (avgAccuracy < 7.0)        priorityTopics.add("Core " + session.getTrack().getName() + " Concepts");
        if (avgFluency < 6.5)         priorityTopics.add("Verbal Communication & Fluency");
        if (avgLeadership < 6.5)      priorityTopics.add("Leadership & Teamwork Stories");
        if (priorityTopics.isEmpty()) priorityTopics.add("Advanced " + session.getTrack().getName() + " Topics");

        String priorityJson = priorityTopics.stream()
                .map(t -> "\"" + t + "\"")
                .collect(Collectors.joining(",", "[", "]"));
        String roadmapJson = String.format(
            "{\"priority_topics\":%s," +
            "\"weeks\":[{\"week\":1,\"focus\":\"%s\",\"topics\":[\"Study key concepts\",\"Practice examples\"]}," +
            "{\"week\":2,\"focus\":\"Mock Interviews\",\"topics\":[\"Technical mock\",\"HR mock\",\"Time management\"]}]," +
            "\"estimated_duration_weeks\":4}",
            priorityJson, priorityTopics.get(0));

        LearningRoadmap roadmap = roadmapRepository.findBySessionId(sessionId)
                .orElse(LearningRoadmap.builder().session(session).user(session.getUser()).build());
        roadmap.setRoadmapJson(roadmapJson);
        roadmapRepository.save(roadmap);

        // ─── Finalize Session ─────────────────────────────────────────────────
        session.setOverallScore(overallScore);
        session.setRecommendation(recommendation);
        session.setStatus(SessionStatus.COMPLETED);
        sessionRepository.save(session);

        notificationService.sendReportReadyEmail(session.getUser().getId(), sessionId);
        log.info("Report generated: session={} techScore={} hrScore={} overall={} recommendation={}",
                sessionId, techScore, hrFinalScore, overallScore, recommendation);
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
                .hrScore(r.getHrScore())
                .overallScore(r.getOverallScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .technicalBreakdown(r.getTechnicalBreakdown())
                .hrBreakdown(r.getHrBreakdown())
                .strengths(r.getStrengths())
                .weaknesses(r.getWeaknesses())
                .aiSummary(r.getAiSummary())
                .pdfS3Url(r.getPdfS3Url())
                .generatedAt(r.getGeneratedAt() != null ? r.getGeneratedAt().toString() : null)
                .build();
    }
}
