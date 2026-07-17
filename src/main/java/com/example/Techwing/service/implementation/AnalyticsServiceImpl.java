package com.example.Techwing.service.implementation;

import com.example.Techwing.models.SessionStatus;
import com.example.Techwing.repository.*;
import com.example.Techwing.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewReportRepository reportRepository;
    private final TechnologyTrackRepository trackRepository;

    @Override
    public Map<String, Object> getPlatformOverview() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalStudents", userRepository.count());
        data.put("totalSessions", sessionRepository.count());
        data.put("completedSessions", sessionRepository.countByStatus(SessionStatus.COMPLETED));
        data.put("totalTracks", trackRepository.count());
        data.put("averageOverallScore", sessionRepository.findAverageOverallScore());
        return data;
    }

    @Override
    public Map<String, Object> getTrackAnalytics(Long trackId) {
        Map<String, Object> data = new HashMap<>();
        data.put("trackId", trackId);
        data.put("totalSessions", sessionRepository.count());
        return data;
    }

    @Override
    public Map<String, Object> getLeaderboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("leaderboard", reportRepository.findAll().stream()
                .sorted((a, b) -> Double.compare(
                        b.getOverallScore() != null ? b.getOverallScore() : 0,
                        a.getOverallScore() != null ? a.getOverallScore() : 0))
                .limit(10)
                .map(r -> Map.of(
                        "name", r.getUser().getName(),
                        "score", r.getOverallScore(),
                        "recommendation", r.getRecommendation() != null ? r.getRecommendation().name() : "N/A"
                ))
                .toList());
        return data;
    }

    @Override
    public Map<String, Object> getStudentAnalytics(Long userId) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("completedSessions", sessionRepository.countCompletedByUserId(userId));
        data.put("reports", reportRepository.findByUserIdOrderByGeneratedAtDesc(userId).size());
        return data;
    }
}
