package com.example.Techwing.controller;

import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.payload.ApiResponse;
import com.example.Techwing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
public class AdminController {

    private final TechnologyTrackRepository trackRepository;
    private final TechnicalQuestionRepository questionRepository;
    private final HRQuestionRepository hrQuestionRepository;
    private final CodingProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;

    @GetMapping("/tracks")
    public ResponseEntity<ApiResponse<List<TechnologyTrack>>> getTracks() {
        return ResponseEntity.ok(ApiResponse.success(trackRepository.findByIsActiveTrue()));
    }

    @PostMapping("/tracks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TechnologyTrack>> createTrack(@RequestBody TechnologyTrack track) {
        track.setIsActive(true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Track created", trackRepository.save(track)));
    }

    @PutMapping("/tracks/{id}")
    public ResponseEntity<ApiResponse<TechnologyTrack>> updateTrack(
            @PathVariable Long id, @RequestBody TechnologyTrack updated) {
        TechnologyTrack t = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", id));
        t.setName(updated.getName());
        t.setDescription(updated.getDescription());
        return ResponseEntity.ok(ApiResponse.success(trackRepository.save(t)));
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

    @GetMapping("/coding-problems/{trackId}")
    public ResponseEntity<ApiResponse<List<CodingProblem>>> getProblems(@PathVariable Long trackId) {
        return ResponseEntity.ok(ApiResponse.success(problemRepository.findByTrackIdAndIsActiveTrue(trackId)));
    }

    @PostMapping("/coding-problems")
    public ResponseEntity<ApiResponse<CodingProblem>> addProblem(@RequestBody CodingProblem p) {
        p.setIsActive(true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Problem added", problemRepository.save(p)));
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

    @PutMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> toggleUser(@PathVariable Long id, @RequestParam boolean active) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        u.setIsActive(active);
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success("User " + (active ? "activated" : "deactivated"), null));
    }
}
