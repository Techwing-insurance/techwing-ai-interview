package com.example.Techwing.controller;

import com.example.Techwing.service.AIClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * VoiceController — handles STT (audio upload → transcript) and TTS (text → audio).
 * Used by React frontend for voice recording and question audio playback.
 */
@RestController
@RequestMapping("/api/voice")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VoiceController {

    private final AIClientService aiClientService;

    /**
     * POST /api/voice/transcribe?roundType=TECHNICAL|HR
     * Receives audio blob, sends to Python Whisper, returns transcript.
     */
    @PostMapping("/transcribe")
    public ResponseEntity<String> transcribe(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(defaultValue = "TECHNICAL") String roundType) throws Exception {
        String transcript = aiClientService.transcribeAudio(
                audio.getBytes(), audio.getOriginalFilename(), roundType);
        return ResponseEntity.ok(transcript);
    }

    /**
     * POST /api/voice/tts?text=...&voice=nova
     * Returns audio/mpeg bytes for the given question text.
     */
    @PostMapping("/tts")
    public ResponseEntity<byte[]> textToSpeech(
            @RequestParam String text,
            @RequestParam(defaultValue = "nova") String voice) {
        byte[] audio = aiClientService.generateSpeech(text, voice);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"question.mp3\"")
                .body(audio);
    }

    /**
     * GET /api/voice/ai-health
     * Checks if Python AI service is reachable.
     */
    @GetMapping("/ai-health")
    public ResponseEntity<String> aiHealth() {
        boolean healthy = aiClientService.isAIServiceHealthy();
        return ResponseEntity.ok(healthy ? "AI_SERVICE_UP" : "AI_SERVICE_DOWN");
    }
}
