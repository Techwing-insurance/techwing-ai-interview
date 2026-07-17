package com.example.Techwing.service;

public interface NotificationService {
    void sendReportReadyEmail(Long userId, Long sessionId);
    void sendWelcomeEmail(String email, String name);
    void sendInterviewScheduledEmail(String email, String name, String trackName);
}
