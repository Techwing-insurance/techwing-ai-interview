package com.example.Techwing.service.implementation;

import com.example.Techwing.repository.UserRepository;
import com.example.Techwing.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Override
    @Async
    public void sendReportReadyEmail(Long userId, Long sessionId) {
        userRepository.findById(userId).ifPresent(user -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(user.getEmail());
                message.setSubject("TechWings - Your Interview Report is Ready!");
                message.setText(String.format(
                    "Dear %s,\n\nYour interview report for session #%d is now ready.\n" +
                    "Please log in to your dashboard to view and download your report.\n\n" +
                    "Best regards,\nTechWings Team", user.getName(), sessionId));
                mailSender.send(message);
                log.info("Report ready email sent to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
            }
        });
    }

    @Override
    @Async
    public void sendWelcomeEmail(String email, String name) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Welcome to TechWings AI Interview Platform!");
            message.setText(String.format(
                "Dear %s,\n\nWelcome to TechWings AI Interview Platform!\n" +
                "You can now upload your resume and start your interview journey.\n\n" +
                "Best regards,\nTechWings Team", name));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send welcome email: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendInterviewScheduledEmail(String email, String name, String trackName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("TechWings - Interview Ready: " + trackName);
            message.setText(String.format(
                "Dear %s,\n\nYour %s interview is ready to begin!\n" +
                "Log in and click 'Start Interview' from your dashboard.\n\n" +
                "Best regards,\nTechWings Team", name, trackName));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send interview scheduled email: {}", e.getMessage());
        }
    }
}
