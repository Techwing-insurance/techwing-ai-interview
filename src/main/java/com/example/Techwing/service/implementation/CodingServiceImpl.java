package com.example.Techwing.service.implementation;

import com.example.Techwing.exception.InterviewException;
import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.payload.CodeRunRequest;
import com.example.Techwing.payload.CodeRunResponse;
import com.example.Techwing.repository.*;
import com.example.Techwing.service.CodingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CodingServiceImpl implements CodingService {

    private final CodingProblemRepository problemRepository;
    private final CodingSubmissionRepository submissionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Override
    public List<CodingProblem> startCodingRound(Long userId) {
        InterviewSession session = sessionRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "userId", userId));
        if (session.getStatus() != SessionStatus.TECHNICAL_COMPLETE)
            throw new InterviewException("Please complete the technical round first");

        session.setStatus(SessionStatus.CODING_IN_PROGRESS);
        sessionRepository.save(session);

        List<CodingProblem> problems = problemRepository
                .findByTrackIdAndIsActiveTrue(session.getTrack().getId());
        if (problems.isEmpty())
            throw new InterviewException("No coding problems available for this track");

        // Return max configured number of problems
        int count = session.getConfig().getCodingProblemCount();
        List<CodingProblem> selected = problems.subList(0, Math.min(count, problems.size()));

        // Strip hidden test cases from response
        selected.forEach(p -> p.setHiddenTestCases(null));
        log.info("Coding round started for user: {}", userId);
        return selected;
    }

    @Override
    public CodingProblem getProblemById(Long problemId) {
        CodingProblem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("CodingProblem", "id", problemId));
        problem.setHiddenTestCases(null); // Never expose to client
        return problem;
    }

    @Override
    public CodeRunResponse runCode(CodeRunRequest request) {
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));
        CodingProblem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", request.getProblemId()));

        // TODO: Call Judge0 API or Docker sandbox
        // Mock: run against sample test cases only
        CodingSubmission submission = CodingSubmission.builder()
                .session(session)
                .problem(problem)
                .language(request.getLanguage())
                .code(request.getCode())
                .submissionType(SubmissionType.RUN)
                .status(SubmissionStatus.ACCEPTED)
                .totalTestCases(2)
                .passedTestCases(2)
                .executionTimeMs(45)
                .memoryUsedMb(12)
                .build();
        submission = submissionRepository.save(submission);
        log.info("Code run for session: {} problem: {}", request.getSessionId(), request.getProblemId());

        return CodeRunResponse.builder()
                .submissionId(submission.getId())
                .status(submission.getStatus())
                .passedCases(2)
                .totalCases(2)
                .executionTimeMs(45)
                .memoryMb(12)
                .stdout("Test 1: PASS\nTest 2: PASS")
                .build();
    }

    @Override
    public CodeRunResponse submitCode(CodeRunRequest request) {
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));
        CodingProblem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", request.getProblemId()));

        // TODO: Call Judge0 API with all hidden test cases
        int totalCases = 10;
        int passedCases = 8; // Mock result
        int score = (passedCases * 100) / totalCases;
        SubmissionStatus status = passedCases == totalCases ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;

        String aiFeedback = passedCases == totalCases
                ? "All test cases passed! Consider optimizing the time complexity from O(n^2) to O(n) using a HashMap."
                : "8/10 test cases passed. Review edge cases for empty input and duplicate elements.";

        CodingSubmission submission = CodingSubmission.builder()
                .session(session)
                .problem(problem)
                .language(request.getLanguage())
                .code(request.getCode())
                .submissionType(SubmissionType.SUBMIT)
                .status(status)
                .totalTestCases(totalCases)
                .passedTestCases(passedCases)
                .executionTimeMs(120)
                .memoryUsedMb(18)
                .aiFeedback(aiFeedback)
                .build();
        submission = submissionRepository.save(submission);

        log.info("Code submitted for session: {} problem: {} score: {}%", request.getSessionId(), request.getProblemId(), score);
        return CodeRunResponse.builder()
                .submissionId(submission.getId())
                .status(status)
                .passedCases(passedCases)
                .totalCases(totalCases)
                .executionTimeMs(120)
                .memoryMb(18)
                .aiFeedback(aiFeedback)
                .score(score)
                .build();
    }

    @Override
    public void completeCodingRound(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        List<CodingSubmission> submissions = submissionRepository
                .findBySessionIdAndSubmissionType(sessionId, SubmissionType.SUBMIT);

        double totalScore = 0;
        for (CodingSubmission sub : submissions) {
            if (sub.getTotalTestCases() != null && sub.getTotalTestCases() > 0) {
                totalScore += (double) sub.getPassedTestCases() / sub.getTotalTestCases() * 100;
            }
        }
        double codingScore = submissions.isEmpty() ? 0 : totalScore / submissions.size();
        session.setCodingScore(codingScore);
        session.setStatus(SessionStatus.CODING_COMPLETE);
        sessionRepository.save(session);
        log.info("Coding round completed for session: {} score: {}", sessionId, codingScore);
    }
}
