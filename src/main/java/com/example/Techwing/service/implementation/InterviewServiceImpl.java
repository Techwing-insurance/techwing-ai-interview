package com.example.Techwing.service.implementation;

import com.example.Techwing.exception.InterviewException;
import com.example.Techwing.exception.ResourceNotFoundException;
import com.example.Techwing.models.*;
import com.example.Techwing.payload.*;
import com.example.Techwing.repository.*;
import com.example.Techwing.service.InterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InterviewServiceImpl implements InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final TechnicalQuestionRepository technicalQuestionRepository;
    private final TechnicalAnswerRepository technicalAnswerRepository;
    private final HRQuestionRepository hrQuestionRepository;
    private final HRAnswerRepository hrAnswerRepository;
    private final UserRepository userRepository;
    private final InterviewConfigurationRepository configRepository;
    private final ResumeRepository resumeRepository;

    // ─── TECHNICAL ROUND ──────────────────────────────────────────────────────

    @Override
    public InterviewStartResponse startTechnicalRound(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if there is already an active session
        sessionRepository.findTopByUserIdOrderByCreatedAtDesc(userId).ifPresent(s -> {
            if (s.getStatus() != SessionStatus.COMPLETED && s.getStatus() != SessionStatus.ABANDONED) {
                throw new InterviewException("You already have an active interview session: " + s.getId());
            }
        });

        // fallback: get first active config
        InterviewConfiguration config = configRepository.findAll().stream()
                .filter(InterviewConfiguration::getIsActive).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("InterviewConfiguration", "active", "true"));

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .track(config.getTrack())
                .config(config)
                .status(SessionStatus.TECHNICAL_IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        session = sessionRepository.save(session);

        List<TechnicalQuestion> questions = technicalQuestionRepository
                .findByTrackIdAndIsActiveTrue(config.getTrack().getId());
        if (questions.isEmpty())
            throw new InterviewException("No questions available for this track");

        TechnicalQuestion firstQ = questions.get(0);
        TechnicalAnswer answer = TechnicalAnswer.builder()
                .session(session)
                .question(firstQ)
                .questionOrder(1)
                .build();
        technicalAnswerRepository.save(answer);

        log.info("Technical round started for user: {} session: {}", userId, session.getId());
        return InterviewStartResponse.builder()
                .sessionId(session.getId())
                .totalQuestions(Math.min(questions.size(), config.getTechnicalQuestionCount()))
                .timeLimitMinutes(config.getTechnicalTimeMinutes())
                .questionId(firstQ.getId())
                .questionOrder(1)
                .questionText(firstQ.getQuestionText())
                .category(firstQ.getCategory())
                .difficulty(firstQ.getDifficulty().name())
                .build();
    }

    @Override
    public AnswerEvalResponse submitTechnicalAnswer(AnswerRequest request) {
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        TechnicalAnswer answer = technicalAnswerRepository
                .findTopBySessionIdOrderByQuestionOrderDesc(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("TechnicalAnswer", "sessionId", request.getSessionId()));

        answer.setTranscript(request.getTranscript());
        answer.setAudioS3Url(request.getAudioS3Url());
        answer.setAnsweredAt(LocalDateTime.now());

        // TODO: Call Python AI service for evaluation
        // Mock evaluation
        double mockScore = 7.5 + java.util.concurrent.ThreadLocalRandom.current().nextDouble() * 2.5;
        answer.setScore(mockScore);
        answer.setAccuracyScore(mockScore * 0.5);
        answer.setDepthScore(mockScore * 0.3);
        answer.setCommunicationScore(mockScore * 0.2);
        answer.setAiFeedback("Good explanation. Could elaborate more on the internals.");
        technicalAnswerRepository.save(answer);

        long answered = technicalAnswerRepository.countBySessionId(session.getId());
        int total = session.getConfig().getTechnicalQuestionCount();
        boolean hasNext = answered < total;

        log.info("Technical answer submitted for session: {} order: {}", request.getSessionId(), request.getQuestionOrder());
        return AnswerEvalResponse.builder()
                .transcript(request.getTranscript())
                .evaluated(true)
                .score(mockScore)
                .feedback(answer.getAiFeedback())
                .nextAvailable(hasNext)
                .questionsRemaining((int)(total - answered))
                .build();
    }

    @Override
    public QuestionResponse getNextTechnicalQuestion(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        long answered = technicalAnswerRepository.countBySessionId(sessionId);
        int total = session.getConfig().getTechnicalQuestionCount();
        if (answered >= total) throw new InterviewException("All questions have been answered");

        List<TechnicalQuestion> questions = technicalQuestionRepository
                .findByTrackIdAndIsActiveTrue(session.getTrack().getId());

        if (answered >= questions.size()) throw new InterviewException("No more questions available");
        TechnicalQuestion nextQ = questions.get((int) answered);

        TechnicalAnswer nextAnswer = TechnicalAnswer.builder()
                .session(session)
                .question(nextQ)
                .questionOrder((int) answered + 1)
                .build();
        technicalAnswerRepository.save(nextAnswer);

        return QuestionResponse.builder()
                .questionId(nextQ.getId())
                .order((int) answered + 1)
                .questionText(nextQ.getQuestionText())
                .category(nextQ.getCategory())
                .difficulty(nextQ.getDifficulty().name())
                .hasNext(answered + 1 < total)
                .totalQuestions(total)
                .build();
    }

    @Override
    public void completeTechnicalRound(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        Double avgScore = technicalAnswerRepository.findAverageScoreBySessionId(sessionId);
        session.setTechnicalScore(avgScore != null ? avgScore * 10 : 0.0);
        session.setStatus(SessionStatus.TECHNICAL_COMPLETE);
        session.setTechnicalEndAt(LocalDateTime.now());
        sessionRepository.save(session);
        log.info("Technical round completed for session: {}", sessionId);
    }

    // ─── HR ROUND ─────────────────────────────────────────────────────────────

    @Override
    public InterviewStartResponse startHRRound(Long userId) {
        InterviewSession session = sessionRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "userId", userId));
        if (session.getStatus() != SessionStatus.CODING_COMPLETE)
            throw new InterviewException("Please complete the coding round first");

        List<HRQuestion> questions = hrQuestionRepository.findByIsActiveTrue();
        if (questions.isEmpty()) throw new InterviewException("No HR questions available");

        session.setStatus(SessionStatus.HR_IN_PROGRESS);
        sessionRepository.save(session);

        HRQuestion firstQ = questions.get(0);
        HRAnswer answer = HRAnswer.builder()
                .session(session)
                .question(firstQ)
                .questionOrder(1)
                .build();
        hrAnswerRepository.save(answer);

        return InterviewStartResponse.builder()
                .sessionId(session.getId())
                .totalQuestions(Math.min(questions.size(), session.getConfig().getHrQuestionCount()))
                .timeLimitMinutes(session.getConfig().getHrTimeMinutes())
                .questionId(firstQ.getId())
                .questionOrder(1)
                .questionText(firstQ.getQuestionText())
                .category(firstQ.getCategory().name())
                .build();
    }

    @Override
    public AnswerEvalResponse submitHRAnswer(AnswerRequest request) {
        HRAnswer answer = hrAnswerRepository
                .findBySessionIdOrderByQuestionOrder(request.getSessionId())
                .stream().filter(a -> a.getQuestionOrder().equals(request.getQuestionOrder()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("HRAnswer", "order", request.getQuestionOrder()));

        answer.setTranscript(request.getTranscript());
        answer.setAudioS3Url(request.getAudioS3Url());
        answer.setAnsweredAt(LocalDateTime.now());

        // TODO: Call Python AI service for HR evaluation
        answer.setConfidenceScore(8.0);
        answer.setCommunicationScore(8.5);
        answer.setFluencyScore(7.5);
        answer.setGrammarScore(9.0);
        answer.setLeadershipScore(7.0);
        answer.setPositivityScore(8.5);
        answer.setProfessionalismScore(8.0);
        answer.setOverallHrScore(8.1);
        answer.setAiFeedback("Confident and clear response. Good use of examples.");
        hrAnswerRepository.save(answer);

        long answered = hrAnswerRepository.countBySessionId(request.getSessionId());
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("InterviewSession", "id", request.getSessionId()));
        int total = session.getConfig().getHrQuestionCount();

        return AnswerEvalResponse.builder()
                .transcript(request.getTranscript())
                .evaluated(true)
                .score(answer.getOverallHrScore())
                .feedback(answer.getAiFeedback())
                .nextAvailable(answered < total)
                .questionsRemaining((int)(total - answered))
                .build();
    }

    @Override
    public QuestionResponse getNextHRQuestion(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        long answered = hrAnswerRepository.countBySessionId(sessionId);
        int total = session.getConfig().getHrQuestionCount();
        if (answered >= total) throw new InterviewException("All HR questions answered");

        List<HRQuestion> questions = hrQuestionRepository.findByIsActiveTrue();
        if (answered >= questions.size()) throw new InterviewException("No more HR questions");
        HRQuestion nextQ = questions.get((int) answered);

        HRAnswer nextAnswer = HRAnswer.builder()
                .session(session).question(nextQ).questionOrder((int) answered + 1).build();
        hrAnswerRepository.save(nextAnswer);

        return QuestionResponse.builder()
                .questionId(nextQ.getId())
                .order((int) answered + 1)
                .questionText(nextQ.getQuestionText())
                .category(nextQ.getCategory().name())
                .hasNext(answered + 1 < total)
                .totalQuestions(total)
                .build();
    }

    @Override
    public void completeHRRound(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        Double avgHR = hrAnswerRepository.findAverageHRScoreBySessionId(sessionId);
        session.setHrScore(avgHR != null ? avgHR * 10 : 0.0);
        session.setStatus(SessionStatus.HR_COMPLETE);
        session.setHrEndAt(LocalDateTime.now());
        sessionRepository.save(session);
        log.info("HR round completed for session: {}", sessionId);
    }
}
