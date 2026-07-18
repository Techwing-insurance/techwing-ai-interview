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
        if (technologyTrackRepository.count() > 0) {
            log.info("Technology tracks already exist, skipping seed.");
            return;
        }
        log.info("Seeding 5 Technology Tracks...");

        List<TechnologyTrack> defaultTracks = List.of(
            TechnologyTrack.builder()
                .name("Java Full Stack Developer")
                .description("Spring Boot + React + MySQL — Full-stack Java web development covering REST APIs, JPA/Hibernate, React frontend, and relational database design.")
                .iconUrl("https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg")
                .isActive(true)
                .build(),

            TechnologyTrack.builder()
                .name("MERN Stack Developer")
                .description("MongoDB + Express + React + Node.js — Full-stack JavaScript development covering REST APIs, NoSQL databases, React state management, and server-side Node.")
                .iconUrl("https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg")
                .isActive(true)
                .build(),

            TechnologyTrack.builder()
                .name("AWS Cloud Engineer")
                .description("Amazon Web Services — Cloud infrastructure covering EC2, S3, RDS, Lambda, VPC, IAM, CloudFormation, and core AWS solution architecture.")
                .iconUrl("https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg")
                .isActive(true)
                .build(),

            TechnologyTrack.builder()
                .name("DevOps Engineer")
                .description("Docker + Kubernetes + CI/CD — Infrastructure automation covering containerization, orchestration, Jenkins/GitHub Actions pipelines, monitoring, and IaC with Terraform.")
                .iconUrl("https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg")
                .isActive(true)
                .build(),

            TechnologyTrack.builder()
                .name("Generative AI Engineer")
                .description("LLMs + RAG + Agents — AI application development covering prompt engineering, LangChain, vector databases, fine-tuning, and production GenAI system design.")
                .iconUrl("https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg")
                .isActive(true)
                .build()
        );

        technologyTrackRepository.saveAll(defaultTracks);
        log.info("Successfully seeded 5 Technology Tracks.");
    }

    private void seedInterviewConfigurations() {
        if (interviewConfigurationRepository.count() > 0) {
            log.info("Interview configurations already exist, skipping seed.");
            return;
        }
        log.info("Seeding Interview Configurations for all 5 tracks...");

        List<TechnologyTrack> tracks = technologyTrackRepository.findAll();
        for (TechnologyTrack track : tracks) {
            InterviewConfiguration config = InterviewConfiguration.builder()
                    .track(track)
                    .technicalQuestionCount(10)   // 5 resume-based + 5 role-based, AI generated
                    .technicalTimeMinutes(25)
                    .codingProblemCount(0)         // Coding round DISABLED
                    .codingTimeMinutes(0)          // Coding round DISABLED
                    .hrQuestionCount(5)
                    .hrTimeMinutes(12)
                    .isActive(true)
                    .build();
            interviewConfigurationRepository.save(config);
        }
        log.info("Successfully seeded Interview Configurations for all {} tracks.", tracks.size());
    }
}
