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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.example.Techwing.service.AIClientService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final AIClientService aiClientService;

    // ─── TECHNICAL ROUND ──────────────────────────────────────────────────────

    @Override
    public InterviewStartResponse startTechnicalRound(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if there is already an active session
        Optional<InterviewSession> activeSessionOpt = sessionRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
        if (activeSessionOpt.isPresent()) {
            InterviewSession s = activeSessionOpt.get();
            if (s.getStatus() != SessionStatus.COMPLETED && s.getStatus() != SessionStatus.ABANDONED) {
                log.info("Abandoning previous incomplete session: {}", s.getId());
                s.setStatus(SessionStatus.ABANDONED);
                sessionRepository.save(s);
            }
        }

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

        // Fetch resume analysis to get skills
        List<String> skills = new ArrayList<>();
        resumeAnalysisRepository.findByUserId(userId).ifPresent(analysis -> {
            try {
                if (analysis.getSkills() != null) {
                    JsonNode skillsNode = new ObjectMapper().readTree(analysis.getSkills());
                    if (skillsNode.isArray()) {
                        for (JsonNode node : skillsNode) skills.add(node.asText());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse skills from resume analysis", e);
            }
        });

        // Force exactly 10 questions: 5 from resume, 5 from role
        int qCount = 10;
        List<TechnicalQuestion> sessionQuestions = new ArrayList<>();
        JsonNode aiQuestions = aiClientService.generateTechnicalQuestions(config.getTrack().getName(), skills, qCount);
        
        if (aiQuestions != null && aiQuestions.isArray()) {
            for (JsonNode qNode : aiQuestions) {
                Difficulty diff = Difficulty.MEDIUM;
                try {
                    diff = Difficulty.valueOf(qNode.path("difficulty").asText("MEDIUM").toUpperCase());
                } catch (Exception ignored) {}
                
                String cat = qNode.path("category").asText("TECHNICAL");
                if (cat.length() > 90) cat = cat.substring(0, 90);

                TechnicalQuestion q = TechnicalQuestion.builder()
                        .track(config.getTrack())
                        .questionText(qNode.path("question_text").asText("Explain this concept"))
                        .expectedAnswer(qNode.path("expected_answer").asText("A reasonable technical answer"))
                        .difficulty(diff)
                        .category(cat)
                        .isActive(true)
                        .build();
                q = technicalQuestionRepository.save(q);
                sessionQuestions.add(q);
            }
        } else {
            // Fallback to static if AI fails
            sessionQuestions = technicalQuestionRepository.findByTrackIdAndIsActiveTrue(config.getTrack().getId());
        }

        if (sessionQuestions.isEmpty()) {
            throw new InterviewException("No questions available for this track and AI generation failed");
        }
        
        // Ensure we only have up to qCount questions
        if (sessionQuestions.size() > qCount) {
            sessionQuestions = sessionQuestions.subList(0, qCount);
        }

        // Pre-create answers for the session so we can fetch them sequentially
        for (int i = 0; i < sessionQuestions.size(); i++) {
            TechnicalAnswer answer = TechnicalAnswer.builder()
                    .session(session)
                    .question(sessionQuestions.get(i))
                    .questionOrder(i + 1)
                    .build();
            technicalAnswerRepository.save(answer);
        }

        TechnicalQuestion firstQ = sessionQuestions.get(0);

        log.info("Technical round started for user: {} session: {}", userId, session.getId());
        return InterviewStartResponse.builder()
                .sessionId(session.getId())
                .totalQuestions(sessionQuestions.size())
                .timeLimitMinutes(config.getTechnicalTimeMinutes())
                .questionId(firstQ.getId())
                .questionOrder(1)
                .questionText(firstQ.getQuestionText())
                .category(firstQ.getCategory())
                .difficulty(firstQ.getDifficulty().name())
                .build();
    }

    private InterviewStartResponse resumeTechnicalRound(InterviewSession session) {
        List<TechnicalAnswer> pendingAnswers = technicalAnswerRepository.findBySessionIdAndTranscriptIsNullOrderByQuestionOrderAsc(session.getId());
        
        if (pendingAnswers.isEmpty()) {
            throw new InterviewException("Technical round is already completed for this session.");
        }

        TechnicalAnswer nextAnswer = pendingAnswers.get(0);
        TechnicalQuestion nextQ = nextAnswer.getQuestion();
        
        log.info("Resuming technical round for session: {}", session.getId());
        return InterviewStartResponse.builder()
                .sessionId(session.getId())
                .totalQuestions(10)
                .timeLimitMinutes(session.getConfig().getTechnicalTimeMinutes())
                .questionId(nextQ.getId())
                .questionOrder(nextAnswer.getQuestionOrder())
                .questionText(nextQ.getQuestionText())
                .category(nextQ.getCategory())
                .difficulty(nextQ.getDifficulty().name())
                .build();
    }

    @Override
    public AnswerEvalResponse submitTechnicalAnswer(AnswerRequest request) {
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        TechnicalAnswer answer = technicalAnswerRepository
                .findBySessionIdAndQuestionOrder(request.getSessionId(), request.getQuestionOrder())
                .orElseThrow(() -> new ResourceNotFoundException("TechnicalAnswer", "sessionId/questionOrder", request.getSessionId()));

        answer.setTranscript(request.getTranscript());
        answer.setAudioS3Url(request.getAudioS3Url());
        answer.setAnsweredAt(LocalDateTime.now());

        // Call Python AI service for evaluation
        double mockScore = 5.0; // fallback
        String aiFeedback = "Answer recorded.";
        
        JsonNode aiResponse = aiClientService.evaluateTechnicalAnswer(
                answer.getQuestion().getQuestionText(),
                answer.getQuestion().getExpectedAnswer(),
                request.getTranscript(),
                session.getTrack().getName()
        );
        
        if (aiResponse != null) {
            try {
                mockScore = aiResponse.get("score").asDouble();
                answer.setAccuracyScore(aiResponse.get("accuracy_score").asDouble());
                answer.setDepthScore(aiResponse.get("depth_score").asDouble());
                answer.setCommunicationScore(aiResponse.get("communication_score").asDouble());
                aiFeedback = aiResponse.get("feedback").asText();
            } catch (Exception e) {
                log.warn("Failed to parse AI evaluation response", e);
            }
        }
        
        answer.setScore(mockScore);
        answer.setAiFeedback(aiFeedback);
        technicalAnswerRepository.save(answer);

        long answered = technicalAnswerRepository.findBySessionIdOrderByQuestionOrder(session.getId())
                .stream().filter(a -> a.getTranscript() != null).count();
        int total = 10; // Forced total from startTechnicalRound
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

        long answeredCount = technicalAnswerRepository.countBySessionId(sessionId) 
                             - technicalAnswerRepository.findBySessionIdAndTranscriptIsNullOrderByQuestionOrderAsc(sessionId).size();
        
        List<TechnicalAnswer> pendingAnswers = technicalAnswerRepository.findBySessionIdAndTranscriptIsNullOrderByQuestionOrderAsc(sessionId);
        
        if (pendingAnswers.isEmpty()) throw new InterviewException("All questions have been answered");

        TechnicalAnswer nextAnswer = pendingAnswers.get(0);
        TechnicalQuestion nextQ = nextAnswer.getQuestion();
        
        int total = session.getConfig().getTechnicalQuestionCount();

        return QuestionResponse.builder()
                .questionId(nextQ.getId())
                .order(nextAnswer.getQuestionOrder())
                .questionText(nextQ.getQuestionText())
                .category(nextQ.getCategory())
                .difficulty(nextQ.getDifficulty().name())
                .hasNext(pendingAnswers.size() > 1)
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
