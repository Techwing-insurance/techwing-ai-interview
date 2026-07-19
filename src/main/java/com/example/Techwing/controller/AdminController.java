package com.example.Techwing.controller;

import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.payload.*;
import com.example.Techwing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
public class AdminController {

    private final TechnologyTrackRepository trackRepository;
    private final TechnicalQuestionRepository questionRepository;
    private final HRQuestionRepository hrQuestionRepository;
    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewConfigurationRepository configRepository;
    private final InterviewReportRepository reportRepository;

    @GetMapping("/tracks")
    public ResponseEntity<ApiResponse<List<TechnologyTrack>>> getTracks() {
        return ResponseEntity.ok(ApiResponse.success(trackRepository.findByIsActiveTrue()));
    }

    @GetMapping("/tracks/{id}")
    public ResponseEntity<ApiResponse<TechnologyTrack>> getTrack(@PathVariable Long id) {
        TechnologyTrack track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TechnologyTrack", "id", id));
        return ResponseEntity.ok(ApiResponse.success(track));
    }

    @PostMapping("/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TechnologyTrack>> createTrack(@RequestBody TechnologyTrack track) {
        track.setIsActive(true);
        TechnologyTrack savedTrack = trackRepository.save(track);
        
        // Auto-create a default Interview Configuration for the new track (Timer 5 mins)
        InterviewConfiguration config = InterviewConfiguration.builder()
                .track(savedTrack)
                .technicalQuestionCount(10)
                .technicalTimeMinutes(5) // Setting 5 minutes timer as requested
                .hrQuestionCount(5)
                .hrTimeMinutes(5)
                .isActive(true)
                .build();
        configRepository.save(config);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Track created", savedTrack));
    }

    @PutMapping("/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TechnologyTrack>> updateTrack(
            @PathVariable Long id, @RequestBody TechnologyTrack updated) {
        TechnologyTrack track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TechnologyTrack", "id", id));
        track.setName(updated.getName());
        track.setDescription(updated.getDescription());
        track.setIconUrl(updated.getIconUrl());
        return ResponseEntity.ok(ApiResponse.success("Track updated", trackRepository.save(track)));
    }

    @GetMapping("/tracks/{id}/config")
    public ResponseEntity<ApiResponse<InterviewConfiguration>> getTrackConfig(@PathVariable Long id) {
        InterviewConfiguration config = configRepository.findByTrackIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("InterviewConfiguration", "trackId", id));
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PutMapping("/tracks/{id}/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InterviewConfiguration>> updateTrackConfig(
            @PathVariable Long id, @RequestBody InterviewConfiguration updated) {
            
        TechnologyTrack track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TechnologyTrack", "id", id));
                
        InterviewConfiguration config = configRepository.findByTrackIdAndIsActiveTrue(id)
                .orElseGet(() -> {
                    InterviewConfiguration newConfig = InterviewConfiguration.builder()
                            .track(track)
                            .technicalQuestionCount(10)
                            .technicalTimeMinutes(5)
                            .hrQuestionCount(5)
                            .hrTimeMinutes(5)
                            .isActive(true)
                            .build();
                    return newConfig;
                });
        if (updated.getTechnicalTimeMinutes() != null) {
            config.setTechnicalTimeMinutes(updated.getTechnicalTimeMinutes());
        }
        if (updated.getTechnicalQuestionCount() != null) {
            config.setTechnicalQuestionCount(updated.getTechnicalQuestionCount());
        }
        if (updated.getHrTimeMinutes() != null) {
            config.setHrTimeMinutes(updated.getHrTimeMinutes());
        }
        if (updated.getHrQuestionCount() != null) {
            config.setHrQuestionCount(updated.getHrQuestionCount());
        }
        return ResponseEntity.ok(ApiResponse.success("Configuration updated", configRepository.save(config)));
    }

    @DeleteMapping("/tracks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteTrack(@PathVariable Long id) {
        TechnologyTrack t = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", id));
        t.setIsActive(false);
        trackRepository.save(t);
        return ResponseEntity.ok(ApiResponse.success("Track deactivated", null));
    }

    @GetMapping("/questions/{trackId}")
    public ResponseEntity<ApiResponse<List<TechnicalQuestion>>> getQuestions(@PathVariable Long trackId) {
        return ResponseEntity.ok(ApiResponse.success(questionRepository.findByTrackIdAndIsActiveTrue(trackId)));
    }

    @PostMapping("/questions")
    public ResponseEntity<ApiResponse<TechnicalQuestion>> addQuestion(@RequestBody TechnicalQuestion q) {
        q.setIsActive(true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added", questionRepository.save(q)));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<ApiResponse<String>> removeQuestion(@PathVariable Long id) {
        TechnicalQuestion q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        q.setIsActive(false);
        questionRepository.save(q);
        return ResponseEntity.ok(ApiResponse.success("Question removed", null));
    }


    @GetMapping("/hr-questions")
    public ResponseEntity<ApiResponse<List<HRQuestion>>> getHRQuestions() {
        return ResponseEntity.ok(ApiResponse.success(hrQuestionRepository.findByIsActiveTrue()));
    }

    @PostMapping("/hr-questions")
    public ResponseEntity<ApiResponse<HRQuestion>> addHRQuestion(@RequestBody HRQuestion q) {
        q.setIsActive(true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("HR question added", hrQuestionRepository.save(q)));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<User>>> getStudents() {
        return ResponseEntity.ok(ApiResponse.success(
                userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).toList()));
    }

    @GetMapping("/students/{userId}/sessions")
    public ResponseEntity<ApiResponse<List<InterviewSession>>> getSessions(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(sessionRepository.findByUserIdOrderByCreatedAtDesc(userId)));
    }

    @GetMapping("/students/performance")
    public ResponseEntity<ApiResponse<List<com.example.Techwing.payload.StudentPerformanceDTO>>> getAllStudentsPerformance() {
        List<User> students = userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).toList();
        List<com.example.Techwing.payload.StudentPerformanceDTO> dtos = students.stream().map(this::mapToPerformanceDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/tracks/{trackId}/students/performance")
    public ResponseEntity<ApiResponse<List<com.example.Techwing.payload.StudentPerformanceDTO>>> getTrackStudentsPerformance(@PathVariable Long trackId) {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT && u.getTrack() != null && u.getTrack().getId().equals(trackId))
                .toList();
        List<com.example.Techwing.payload.StudentPerformanceDTO> dtos = students.stream().map(this::mapToPerformanceDTO).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    private com.example.Techwing.payload.StudentPerformanceDTO mapToPerformanceDTO(User user) {
        com.example.Techwing.payload.StudentPerformanceDTO dto = com.example.Techwing.payload.StudentPerformanceDTO.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .pinNumber(user.getPinNumber())
                .year(user.getYear())
                .branch(user.getBranch())
                .college(user.getCollege())
                .build();

        sessionRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).ifPresent(session -> {
            dto.setLatestSessionId(session.getId());
            dto.setTrackName(session.getTrack().getName());
            dto.setOverallScore(session.getOverallScore());
            dto.setInterviewDate(session.getCreatedAt());
        });
        return dto;
    }

    @PutMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> toggleUser(@PathVariable Long id, @RequestParam boolean active) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        u.setIsActive(active);
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success("User " + (active ? "activated" : "deactivated"), null));
    }

    // ─── STUDENT PROFILE ──────────────────────────────────────────────────────

    @GetMapping("/students/{userId}")
    public ResponseEntity<ApiResponse<StudentProfileDTO>> getStudentProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<InterviewReport> reports = reportRepository.findByUserIdOrderByGeneratedAtDesc(userId);

        List<ReportSummaryDTO> reportDTOs = reports.stream().map(r -> ReportSummaryDTO.builder()
                .id(r.getId())
                .technicalScore(r.getTechnicalScore())
                .hrScore(r.getHrScore())
                .overallScore(r.getOverallScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .aiSummary(r.getAiSummary())
                .generatedAt(r.getGeneratedAt())
                .build()
        ).collect(Collectors.toList());

        Double averageScore = reports.stream()
                .filter(r -> r.getOverallScore() != null)
                .mapToDouble(InterviewReport::getOverallScore)
                .average()
                .orElse(0.0);

        StudentProfileDTO dto = StudentProfileDTO.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .pinNumber(user.getPinNumber())
                .year(user.getYear() != null ? String.valueOf(user.getYear()) : null)
                .branch(user.getBranch())
                .college(user.getCollege())
                .totalInterviews(reportDTOs.size())
                .averageOverallScore(averageScore)
                .pastReports(reportDTOs)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
