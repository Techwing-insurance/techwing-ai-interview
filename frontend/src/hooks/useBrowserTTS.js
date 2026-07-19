/**
 * useBrowserTTS — Browser Web Speech Synthesis Hook
 *
 * Uses the browser's built-in speechSynthesis API for INSTANT, zero-latency TTS.
 * No API key, no server round-trip, no audio download.
 * On Chrome + Windows: Uses Microsoft Neural voices (Aria, Jenny) — sounds human.
 * On Chrome + Mac: Uses premium macOS voices.
 *
 * Usage:
 *   const { speak, stop, isSpeaking } = useBrowserTTS();
 *   await speak("Hello! Welcome to the interview.");
 */
import { useState, useRef, useEffect, useCallback } from 'react';

// Preferred voice names in order of preference (matches Microsoft Neural voices on Chrome/Windows)
const PREFERRED_VOICES = [
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Aria - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Jenny - English (United States)',
    'Microsoft Zira - English (United States)',
    'Google US English',
    'Samantha',  // macOS
];

/**
 * Wait for voices to be loaded (Chrome loads them async on first call)
 */
const getVoices = () => {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        // Chrome fires voiceschanged event when voices are ready
        const handler = () => {
            resolve(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
        // Fallback timeout in case event never fires
        setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
    });
};

/**
 * Select the best available English voice from the system
 */
const selectBestVoice = (voices) => {
    // Try preferred voices in order
    for (const preferredName of PREFERRED_VOICES) {
        const found = voices.find(v =>
            v.name.toLowerCase().includes(preferredName.toLowerCase()) ||
            preferredName.toLowerCase().includes(v.name.toLowerCase())
        );
        if (found) return found;
    }
    // Fallback: any en-US voice
    return voices.find(v => v.lang === 'en-US') ||
           voices.find(v => v.lang.startsWith('en')) ||
           voices[0] ||
           null;
};

export const useBrowserTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const selectedVoiceRef = useRef(null);
    const isInitializedRef = useRef(false);
    const resolveRef = useRef(null);

    // Initialize voices once
    useEffect(() => {
        if (!window.speechSynthesis) return;

        const init = async () => {
            if (isInitializedRef.current) return;
            isInitializedRef.current = true;
            const voices = await getVoices();
            selectedVoiceRef.current = selectBestVoice(voices);
            console.log('[TTS] Selected voice:', selectedVoiceRef.current?.name || 'default');
        };

        init();

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    /**
     * stop — immediately cancel all pending and active speech
     */
    const stop = useCallback(() => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        if (resolveRef.current) {
            resolveRef.current();
            resolveRef.current = null;
        }
    }, []);

    /**
     * speak(text) — returns Promise that resolves when speech finishes
     *
     * Handles the Chrome bug where long utterances pause after ~15s:
     * we split on sentence boundaries and speak sequentially.
     */
    const speak = useCallback((text) => {
        return new Promise(async (resolve) => {
            if (!window.speechSynthesis || !text?.trim()) {
                resolve();
                return;
            }

            // Cancel any ongoing speech first
            window.speechSynthesis.cancel();

            // Small pause to let cancel() take effect
            await new Promise(r => setTimeout(r, 80));

            // Ensure voices are loaded
            if (!selectedVoiceRef.current) {
                const voices = await getVoices();
                selectedVoiceRef.current = selectBestVoice(voices);
            }

            resolveRef.current = resolve;
            setIsSpeaking(true);

            // Split text into sentences to avoid Chrome 15s pause bug
            const sentences = text
                .replace(/([.!?])\s+/g, '$1|||')
                .split('|||')
                .filter(s => s.trim().length > 0);

            let sentenceIndex = 0;

            const speakNext = () => {
                if (sentenceIndex >= sentences.length) {
                    setIsSpeaking(false);
                    resolveRef.current = null;
                    resolve();
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex]);

                if (selectedVoiceRef.current) {
                    utterance.voice = selectedVoiceRef.current;
                }
                utterance.lang = 'en-US';
                utterance.rate = 1.05;   // Slightly faster than default — sounds natural
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onend = () => {
                    sentenceIndex++;
                    speakNext();
                };

                utterance.onerror = (e) => {
                    // 'interrupted' errors are normal when we cancel — ignore them
                    if (e.error === 'interrupted' || e.error === 'canceled') {
                        return;
                    }
                    console.warn('[TTS] utterance error:', e.error);
                    sentenceIndex++;
                    speakNext();
                };

                window.speechSynthesis.speak(utterance);
            };

            speakNext();
        });
    }, []);

    return { speak, stop, isSpeaking };
};
