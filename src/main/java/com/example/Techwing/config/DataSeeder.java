package com.example.Techwing.config;

import com.example.Techwing.models.Role;
import com.example.Techwing.models.TechnologyTrack;
import com.example.Techwing.models.User;
import com.example.Techwing.repository.TechnologyTrackRepository;
import com.example.Techwing.repository.UserRepository;
import com.example.Techwing.models.InterviewConfiguration;
import com.example.Techwing.repository.InterviewConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TechnologyTrackRepository technologyTrackRepository;
    private final InterviewConfigurationRepository interviewConfigurationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedTechnologyTracks();
        seedInterviewConfigurations();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            log.info("Seeding default Admin user...");
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@gmail.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            log.info("Default Admin created (admin@gmail.com / admin123)");
        }
    }

    private void seedTechnologyTracks() {
        if (technologyTrackRepository.count() == 0) {
            log.info("Seeding default Technology Tracks...");
            
            List<TechnologyTrack> defaultTracks = List.of(
                TechnologyTrack.builder()
                    .name("Java Full Stack")
                    .description("Spring Boot backend with React/Angular frontend")
                    .isActive(true)
                    .build(),
                TechnologyTrack.builder()
                    .name("Python Data Science")
                    .description("Data analysis, Machine Learning, and AI using Python")
                    .isActive(true)
                    .build(),
                TechnologyTrack.builder()
                    .name("MERN Stack")
                    .description("MongoDB, Express, React, and Node.js web development")
                    .isActive(true)
                    .build(),
                TechnologyTrack.builder()
                    .name("Cloud & DevOps")
                    .description("AWS, Docker, Kubernetes, and CI/CD pipelines")
                    .isActive(true)
                    .build()
            );

            technologyTrackRepository.saveAll(defaultTracks);
            log.info("Successfully seeded 4 Technology Tracks.");
        }
    }

    private void seedInterviewConfigurations() {
        if (interviewConfigurationRepository.count() == 0) {
            log.info("Seeding default Interview Configurations...");
            List<TechnologyTrack> tracks = technologyTrackRepository.findAll();
            for (TechnologyTrack track : tracks) {
                InterviewConfiguration config = InterviewConfiguration.builder()
                        .track(track)
                        .technicalQuestionCount(10)
                        .technicalTimeMinutes(25)
                        .codingProblemCount(1)
                        .codingTimeMinutes(30)
                        .hrQuestionCount(3)
                        .hrTimeMinutes(10)
                        .isActive(true)
                        .build();
                interviewConfigurationRepository.save(config);
            }
            log.info("Successfully seeded Interview Configurations for all tracks.");
        }
    }
}
