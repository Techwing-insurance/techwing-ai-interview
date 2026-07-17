package com.example.Techwing.service;

import java.util.Map;

public interface AnalyticsService {
    Map<String, Object> getPlatformOverview();
    Map<String, Object> getTrackAnalytics(Long trackId);
    Map<String, Object> getLeaderboard();
    Map<String, Object> getStudentAnalytics(Long userId);
}
