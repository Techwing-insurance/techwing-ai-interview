package com.example.Techwing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Spring Boot ↔ Python AI Service HTTP Client
 * All AI calls are routed through this service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIClientService {

    private static final String ENDPOINT_RESUME_ANALYZE = "/ai/resume/analyze";
    private static final String ENDPOINT_HR_TRANSCRIBE = "/ai/hr/transcribe";
    private static final String ENDPOINT_TECH_TRANSCRIBE = "/ai/technical/transcribe";
    private static final String ENDPOINT_TECH_EVALUATE = "/ai/technical/evaluate";
    private static final String ENDPOINT_TECH_GENERATE = "/ai/technical/generate-questions";
    private static final String ENDPOINT_HR_EVALUATE = "/ai/hr/evaluate";
    private static final String ENDPOINT_REPORT_GENERATE = "/ai/report/generate";
    private static final String ENDPOINT_TTS_GENERATE = "/ai/tts/generate";
    private static final String ENDPOINT_HEALTH = "/health";
    private static final String HR_ROUND_TYPE = "HR";

    @Value("${ai.service.base-url:https://techwing-ai-interview.onrender.com}")
    private String aiBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ─── RESUME ───────────────────────────────────────────────────────────────

    public JsonNode analyzeResume(String resumeUrl, Long userId, String candidateName) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("resume_url", resumeUrl);
            payload.put("user_id", userId);
            payload.put("candidate_name", candidateName);

            HttpHeaders headers = jsonHeaders();
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_RESUME_ANALYZE, HttpMethod.POST, req, JsonNode.class);
            log.info("Resume AI analysis completed for user: {}", userId);
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("Resume AI analysis failed: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    // ─── STT (Speech-to-Text) ─────────────────────────────────────────────────

    public String transcribeAudio(byte[] audioBytes, String filename, String roundType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(audioBytes) {
                @Override public String getFilename() { return filename; }
            };
            body.add("audio", resource);

            String endpoint = HR_ROUND_TYPE.equalsIgnoreCase(roundType)
                    ? ENDPOINT_HR_TRANSCRIBE
                    : ENDPOINT_TECH_TRANSCRIBE;

            HttpEntity<MultiValueMap<String, Object>> req = new HttpEntity<>(body, headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + endpoint, HttpMethod.POST, req, JsonNode.class);

            if (resp.getBody() != null && resp.getBody().has("transcript")) {
                return resp.getBody().get("transcript").asText("");
            }
        } catch (RestClientException e) {
            log.error("STT transcription failed: {}", e.getMessage());
        }
        return "";
    }

    // ─── TECHNICAL EVALUATION ────────────────────────────────────────────────

    public JsonNode evaluateTechnicalAnswer(String questionText, String expectedAnswer,
                                             String transcript, String technology) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("question_text", questionText);
            payload.put("expected_answer", expectedAnswer);
            payload.put("transcribed_answer", transcript);
            payload.put("technology", technology);

            HttpHeaders headers = jsonHeaders();
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_TECH_EVALUATE, HttpMethod.POST, req, JsonNode.class);
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("Technical evaluation failed: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    public JsonNode generateTechnicalQuestions(String roleName, List<String> resumeSkills, int count) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("role_name", roleName);
            payload.put("resume_skills", resumeSkills);
            payload.put("count", count);

            HttpHeaders headers = jsonHeaders();
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_TECH_GENERATE, HttpMethod.POST, req, JsonNode.class);
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("Technical question generation failed: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    // ─── HR EVALUATION ────────────────────────────────────────────────────────

    public JsonNode evaluateHRAnswer(String questionText, String transcript) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("question_text", questionText);
            payload.put("transcribed_answer", transcript);

            HttpHeaders headers = jsonHeaders();
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_HR_EVALUATE, HttpMethod.POST, req, JsonNode.class);
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("HR evaluation failed: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    // ─── REPORT GENERATION ────────────────────────────────────────────────────

    public JsonNode generateAIReport(Map<String, Object> reportData) {
        try {
            HttpHeaders headers = jsonHeaders();
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(reportData), headers);
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_REPORT_GENERATE, HttpMethod.POST, req, JsonNode.class);
            log.info("AI report generated for session: {}", reportData.get("session_id"));
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("AI report generation failed: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    // ─── TTS (Text-to-Speech) ─────────────────────────────────────────────────

    public byte[] generateSpeech(String text, String voice) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", text);
            payload.put("voice", voice != null ? voice : "nova");

            HttpHeaders headers = jsonHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));
            HttpEntity<String> req = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            ResponseEntity<byte[]> resp = restTemplate.exchange(
                    aiBaseUrl + ENDPOINT_TTS_GENERATE, HttpMethod.POST, req, byte[].class);
            return resp.getBody();
        } catch (RestClientException | JsonProcessingException e) {
            log.error("TTS generation failed: {}", e.getMessage());
            return new byte[0];
        }
    }

    // ─── Health Check ─────────────────────────────────────────────────────────

    public boolean isAIServiceHealthy() {
        try {
            ResponseEntity<JsonNode> resp = restTemplate.getForEntity(aiBaseUrl + ENDPOINT_HEALTH, JsonNode.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (RestClientException e) {
            log.warn("AI service is not reachable: {}", e.getMessage());
            return false;
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
