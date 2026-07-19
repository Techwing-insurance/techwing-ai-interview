/**
 * useBrowserSTT — Browser Web Speech Recognition Hook
 *
 * Uses Chrome's built-in SpeechRecognition API (backed by Google's servers).
 * Zero cost, real-time transcription — no audio upload needed.
 *
 * How it works:
 *   1. Starts listening continuously
 *   2. As user speaks, interim results stream in
 *   3. When user pauses for `silenceDurationMs`, onTranscriptReady fires
 *   4. Hook is self-resetting — starts next recognition automatically
 *
 * Browser support: Chrome ✅, Edge ✅, Firefox ❌ (falls back to VAD+Whisper)
 *
 * Usage:
 *   const { isListening, startListening, stopListening, interimText } = useBrowserSTT({
 *     onTranscriptReady: (transcript) => handleAnswer(transcript),
 *     silenceDurationMs: 1400,
 *   });
 */
import { useState, useRef, useEffect, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const BROWSER_STT_SUPPORTED = !!SpeechRecognition;

export const useBrowserSTT = ({
    onTranscriptReady,
    silenceDurationMs = 1400,
    minSpeechMs = 800,
}) => {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const interimTranscriptRef = useRef('');
    const listeningRef = useRef(false);
    const speechStartedRef = useRef(false);
    const speechStartTimeRef = useRef(0);
    const activeRef = useRef(false); // Prevents callbacks after stop()

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const resetTranscript = () => {
        finalTranscriptRef.current = '';
        interimTranscriptRef.current = '';
        setInterimText('');
    };

    /**
     * Fires onTranscriptReady with accumulated transcript
     */
    const submitTranscript = useCallback(() => {
        if (!activeRef.current) return;

        clearSilenceTimer();
        const combined = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();

        if (!combined || combined.length < 2) {
            // Nothing meaningful said — restart listening
            resetTranscript();
            return;
        }

        const elapsed = Date.now() - speechStartTimeRef.current;
        if (elapsed < minSpeechMs) {
            // Too short — likely noise, restart
            resetTranscript();
            return;
        }

        console.log('[STT] Transcript ready:', combined);
        
        // Force stop STT immediately to prevent recording the AI's response (Audio Collision)
        activeRef.current = false;
        listeningRef.current = false;
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) {}
        }
        setIsListening(false);
        
        resetTranscript();
        if (onTranscriptReady) {
            onTranscriptReady(combined);
        }
    }, [onTranscriptReady, minSpeechMs]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn('[STT] SpeechRecognition not supported in this browser');
            return;
        }

        if (listeningRef.current) return; // Already listening

        // Kill any existing session
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) {}
        }

        activeRef.current = true;
        listeningRef.current = true;
        speechStartedRef.current = false;
        resetTranscript();

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'en-US';
        recognition.continuous = true;       // Keep listening, don't auto-stop
        recognition.interimResults = true;   // Stream results in real-time
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            speechStartTimeRef.current = Date.now();
        };

        recognition.onspeechstart = () => {
            speechStartedRef.current = true;
            speechStartTimeRef.current = Date.now();
            clearSilenceTimer(); // Reset silence timer whenever speech starts
        };

        recognition.onresult = (event) => {
            if (!activeRef.current) return;

            let interim = '';
            let finalAddition = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalAddition += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }

            if (finalAddition) {
                finalTranscriptRef.current += finalAddition;
            }
            interimTranscriptRef.current = interim;

            const displayText = (finalTranscriptRef.current + interim).trim();
            setInterimText(displayText);

            // Reset silence timer — user is still speaking
            clearSilenceTimer();
            silenceTimerRef.current = setTimeout(() => {
                if (activeRef.current) submitTranscript();
            }, silenceDurationMs);
        };

        recognition.onspeechend = () => {
            // Speech ended naturally — start silence timer if not already running
            if (!silenceTimerRef.current && activeRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    if (activeRef.current) submitTranscript();
                }, silenceDurationMs);
            }
        };

        recognition.onerror = (event) => {
            if (!activeRef.current) return;

            if (event.error === 'no-speech') {
                // Expected — just restart
            } else if (event.error === 'aborted') {
                // Intentional abort — don't restart
                return;
            } else if (event.error === 'network') {
                console.warn('[STT] Network error — Chrome STT requires internet');
            } else {
                console.warn('[STT] Error:', event.error);
            }
        };

        recognition.onend = () => {
            if (!activeRef.current) {
                setIsListening(false);
                listeningRef.current = false;
                return;
            }
            // Auto-restart to keep listening continuously
            // Small delay to prevent rapid restart loops
            setTimeout(() => {
                if (activeRef.current && listeningRef.current) {
                    try { recognition.start(); } catch (_) {}
                }
            }, 100);
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('[STT] Failed to start:', err);
            listeningRef.current = false;
            setIsListening(false);
        }
    }, [silenceDurationMs, submitTranscript]);

    const stopListening = useCallback(() => {
        activeRef.current = false;
        listeningRef.current = false;
        clearSilenceTimer();
        resetTranscript();

        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) {}
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            activeRef.current = false;
            listeningRef.current = false;
            clearSilenceTimer();
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_) {}
            }
        };
    }, []);

    return {
        isListening,
        interimText,
        startListening,
        stopListening,
        isSupported: BROWSER_STT_SUPPORTED,
    };
};
