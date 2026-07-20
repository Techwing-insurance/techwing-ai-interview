import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAvatar from '../components/VoiceAvatar';
import TechWingLoader from '../components/TechWingLoader';
import { useBrowserTTS } from '../hooks/useBrowserTTS';
import { useBrowserSTT, BROWSER_STT_SUPPORTED } from '../hooks/useBrowserSTT';
import { useVAD } from '../hooks/useVAD';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Clock, Loader2, Mic, MicOff } from 'lucide-react';
import Swal from 'sweetalert2';
import logo from '../assets/logo.png';

// ─── Status Display Messages ──────────────────────────────────────────────────
const STATUS = {
    IDLE: 'Click "Start Interview" to begin',
    INITIALIZING: 'Connecting to your interviewer...',
    AI_SPEAKING: 'Alex is speaking...',
    LISTENING: 'Listening... speak your answer',
    PROCESSING: 'Alex is thinking...',
    TIME_UP: 'Technical round complete!',
};

const TechnicalRoundPage = () => {
    const navigate = useNavigate();
    const { setSessionId, setCurrentRound } = useInterview();

    // ─── Refs (avoid stale closures) ─────────────────────────────────────────
    const sessionDataRef = useRef(null);
    const questionRef = useRef(null);
    const isTimeUpRef = useRef(false);
    const isProcessingRef = useRef(false);

    // ─── State ────────────────────────────────────────────────────────────────
    const [hasStarted, setHasStarted] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [status, setStatus] = useState(STATUS.IDLE);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [volume, setVolume] = useState(0);

    // ─── Hooks ────────────────────────────────────────────────────────────────
    const { speak, stop: stopTTS, isSpeaking } = useBrowserTTS();

    // ─── Handle answer transcript ─────────────────────────────────────────────
    const handleTranscriptReady = useCallback(async (transcript) => {
        if (!transcript || isTimeUpRef.current || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessing(true);
        setStatus(STATUS.PROCESSING);

        try {
            // Handle "repeat question" naturally
            const lower = transcript.toLowerCase();
            if (lower.includes('repeat') || lower.includes("didn't hear") || lower.includes('say that again') || lower.includes('come again')) {
                isProcessingRef.current = false;
                setIsProcessing(false);
                setStatus(STATUS.AI_SPEAKING);
                await speak("Sure! " + questionRef.current?.text);
                if (!isTimeUpRef.current) {
                    setStatus(STATUS.LISTENING);
                    startListening();
                }
                return;
            }

            // Submit answer to backend (non-blocking: evaluate + save score)
            const payload = {
                sessionId: sessionDataRef.current?.sessionId,
                questionOrder: questionRef.current?.order,
                transcript,
            };

            // Evaluate answer → get feedback
            const res = await interviewService.answerTechnicalQuestion(payload);
            const evalData = res.data.data;

            if (isTimeUpRef.current) {
                isProcessingRef.current = false;
                setIsProcessing(false);
                return;
            }

            // Fetch next question while composing what to say
            let nextQuestionText = null;
            try {
                const nextRes = await interviewService.getNextTechnicalQuestion(
                    sessionDataRef.current?.sessionId
                );
                const nextData = nextRes.data.data;
                questionRef.current = { id: nextData.questionId, order: nextData.order, text: nextData.questionText };
                nextQuestionText = nextData.questionText;
                setQuestionNumber(nextData.order);
            } catch (_) {
                // No more questions — round still continues until timer
            }

            isProcessingRef.current = false;
            setIsProcessing(false);

            if (isTimeUpRef.current) return;

            // Speak feedback + next question together
            const toSpeak = nextQuestionText
                ? `${evalData.feedback}. ${nextQuestionText}`
                : `${evalData.feedback}. That was the last question. Feel free to elaborate on any previous answer.`;

            setStatus(STATUS.AI_SPEAKING);
            await speak(toSpeak);

            if (!isTimeUpRef.current) {
                setStatus(STATUS.LISTENING);
                startListening();
            }
        } catch (err) {
            console.error('[Technical] Error processing answer:', err);
            isProcessingRef.current = false;
            setIsProcessing(false);
            if (!isTimeUpRef.current) {
                setStatus(STATUS.AI_SPEAKING);
                await speak("Sorry, let's move on. " + (questionRef.current?.text || ''));
                setStatus(STATUS.LISTENING);
                startListening();
            }
        }
    }, [speak]);

    // ─── Browser STT (primary — Chrome) ──────────────────────────────────────
    const {
        isListening: isBrowserListening,
        interimText,
        startListening: startBrowserListening,
        stopListening: stopBrowserListening,
    } = useBrowserSTT({
        onTranscriptReady: handleTranscriptReady,
        silenceDurationMs: 1400,
        minSpeechMs: 800,
    });

    // ─── VAD Fallback (Firefox / non-Chrome browsers) ────────────────────────
    const handleVADSpeechEnd = useCallback(async (audioBlob) => {
        if (!audioBlob || isTimeUpRef.current || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessing(true);
        setStatus(STATUS.PROCESSING);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');
            let transcript = 'No response detected.';
            try {
                const res = await interviewService.transcribeVoice(formData, 'TECHNICAL');
                if (res.data) transcript = res.data;
            } catch (_) {}

            isProcessingRef.current = false;
            await handleTranscriptReady(transcript);
        } catch (err) {
            console.error('[VAD Fallback] Error:', err);
            isProcessingRef.current = false;
            setIsProcessing(false);
            if (!isTimeUpRef.current) {
                startVAD();
                setStatus(STATUS.LISTENING);
            }
        }
    }, [handleTranscriptReady]);

    const {
        isRecording: isVADRecording,
        startRecording: startVAD,
        stopRecording: stopVAD,
        volume: vadVolume,
    } = useVAD({
        onSpeechEnd: handleVADSpeechEnd,
        silenceDurationMs: 1400,
        minRecordingMs: 800,
    });

    // ─── Unified controls (use Browser STT if supported, else VAD) ───────────
    const startListening = useCallback(() => {
        if (isTimeUpRef.current) return;
        if (BROWSER_STT_SUPPORTED) {
            startBrowserListening();
        } else {
            startVAD();
        }
        setStatus(STATUS.LISTENING);
    }, [startBrowserListening, startVAD]);

    const stopListening = useCallback(() => {
        if (BROWSER_STT_SUPPORTED) {
            stopBrowserListening();
        } else {
            stopVAD();
        }
    }, [stopBrowserListening, stopVAD]);

    const isRecording = BROWSER_STT_SUPPORTED ? isBrowserListening : isVADRecording;
    const displayVolume = BROWSER_STT_SUPPORTED ? (interimText ? 60 : 0) : vadVolume;

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopTTS();
            stopListening();
        };
    }, []);

    // ─── Start Interview ──────────────────────────────────────────────────────
    const handleStartInterview = async () => {
        setIsInitializing(true);
        setStatus(STATUS.INITIALIZING);

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });

            const res = await interviewService.startTechnicalRound();
            const data = res.data.data;

            sessionDataRef.current = data;
            questionRef.current = {
                id: data.questionId,
                order: data.questionOrder,
                text: data.questionText,
            };

            setSessionId(data.sessionId);
            setCurrentRound('TECHNICAL');
            setQuestionNumber(data.questionOrder || 1);

            const timeLimitSeconds = (data.timeLimitMinutes || 5) * 60;
            setTimeLeft(timeLimitSeconds);
            setHasStarted(true);
            setIsInitializing(false);

            // Speak welcome + first question
            setStatus(STATUS.AI_SPEAKING);
            await speak(
                `Hello! Welcome to the Technical Round. I'm your interviewer today. ` +
                `We'll go through some technical questions. Please speak your answers clearly. ` +
                `Here's your first question: ${data.questionText}`
            );

            if (!isTimeUpRef.current) {
                setStatus(STATUS.LISTENING);
                startListening();
            }
        } catch (err) {
            console.error('Failed to start interview:', err);
            setIsInitializing(false);
            setStatus(STATUS.IDLE);

            if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
                Swal.fire({
                    title: 'Microphone Required',
                    text: 'Please allow microphone access to start the interview.',
                    icon: 'warning',
                    background: '#1a1f2b',
                    color: '#fff',
                    confirmButtonColor: '#CAA928',
                });
            } else {
                Swal.fire({
                    title: 'Connection Error',
                    text: 'Could not start the interview. Please ensure the backend is running.',
                    icon: 'error',
                    background: '#1a1f2b',
                    color: '#fff',
                    confirmButtonColor: '#CAA928',
                });
            }
        }
    };

    // ─── Timer Effect ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasStarted || timeLeft === null || isTimeUp) return;

        if (timeLeft <= 0) {
            handleTimeUp();
            return;
        }

        if (timeLeft === 60) {
            Swal.fire({
                title: '⏰ 1 Minute Left!',
                text: 'Technical round ending soon.',
                icon: 'warning',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                background: '#1a1a1a',
                color: '#fff',
            });
        }

        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isTimeUp, hasStarted]);

    // ─── Time Up ──────────────────────────────────────────────────────────────
    const handleTimeUp = async () => {
        if (isTimeUpRef.current) return;
        isTimeUpRef.current = true;
        setIsTimeUp(true);
        setStatus(STATUS.TIME_UP);

        stopListening();
        stopTTS();

        try {
            const sid = sessionDataRef.current?.sessionId;
            if (sid) await interviewService.completeTechnicalRound(sid);
        } catch (e) {
            console.error('Failed to complete technical round:', e);
        }

        // Inform the candidate and navigate
        await speak('Your technical round is now complete. Moving to the HR round. Good luck!');
        setTimeout(() => navigate('/interview/hr'), 2000);
    };

    // ─── Format Time ─────────────────────────────────────────────────────────
    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return '00:00';
        const s = Math.max(0, seconds);
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    // ─── Render: Pre-start ────────────────────────────────────────────────────
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-techwing-dark flex items-center justify-center p-6">
                <div className="glass-panel p-12 text-center max-w-md w-full">
                    {/* Mic icon */}
                    <div className="w-20 h-20 bg-techwing-gold/10 border border-techwing-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mic className="w-10 h-10 text-techwing-gold" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">Technical Round</h2>
                    <p className="text-gray-400 mb-2 text-sm">
                        AI Interviewer: <span className="text-techwing-gold font-semibold">Alex</span>
                    </p>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        This is a <strong className="text-white">voice-only</strong> interview. Alex will ask
                        you technical questions and listen to your answers. Speak naturally — just as you would
                        in a real interview.
                    </p>

                    {!BROWSER_STT_SUPPORTED && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs text-left">
                            ⚠️ For best performance, use <strong>Google Chrome</strong>. Your browser will use
                            microphone upload mode instead.
                        </div>
                    )}

                    <button
                        onClick={handleStartInterview}
                        disabled={isInitializing}
                        className="btn-primary w-full flex justify-center items-center py-4 gap-2 text-base font-semibold"
                    >
                        {isInitializing ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                        ) : (
                            <><Mic className="w-5 h-5" /> Enable Microphone &amp; Start</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Render: Interview ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-techwing-dark flex flex-col">

            {/* Time's Up Overlay */}
            {isTimeUp && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="glass-panel p-10 text-center max-w-sm">
                        <div className="w-16 h-16 bg-techwing-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-techwing-gold" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Round Complete!</h2>
                        <p className="text-gray-400 mb-4">Moving to the HR Round...</p>
                        <Loader2 className="w-6 h-6 text-techwing-gold animate-spin mx-auto" />
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Techwing Logo" className="h-9 w-auto object-contain" />
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">Technical Round</h1>
                        <p className="text-xs text-gray-500">
                            Question {questionNumber}
                        </p>
                    </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-semibold text-sm ${
                    timeLeft !== null && timeLeft < 60
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                        : timeLeft !== null && timeLeft < 120
                        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                        : 'bg-white/5 border-white/10 text-gray-300'
                }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            {/* Main — Centered Voice Interface */}
            <main className="flex-grow flex flex-col items-center justify-center gap-8 px-6 py-8">

                {/* AI Avatar — the only visual element */}
                <div className="flex flex-col items-center gap-6">
                    <VoiceAvatar
                        isListening={isRecording}
                        isSpeaking={isSpeaking}
                        isProcessing={isProcessing}
                        volume={displayVolume}
                        onStartListening={startListening}
                        onStopListening={stopListening}
                    />

                    {/* Status text */}
                    <div className="text-center">
                        <p className={`text-base font-medium transition-all duration-300 ${
                            isProcessing ? 'text-yellow-400' :
                            isSpeaking   ? 'text-blue-400'   :
                            isRecording  ? 'text-green-400'  : 'text-gray-400'
                        }`}>
                            {isSpeaking   ? STATUS.AI_SPEAKING :
                             isProcessing ? STATUS.PROCESSING  :
                             isRecording  ? STATUS.LISTENING   : '...'}
                        </p>
                    </div>
                </div>

                {/* Removed manual mic hint as per fully automated flow requirements */}
            </main>

            {/* Bottom instruction bar */}
            <footer className="flex-shrink-0 px-6 py-3 border-t border-white/5 text-center">
                <p className="text-xs text-gray-600">
                    {BROWSER_STT_SUPPORTED
                        ? 'Real-time voice recognition active — stop speaking and the AI will respond'
                        : 'Speak your answer and pause — the AI will respond after 1.4 seconds of silence'}
                </p>
            </footer>
        </div>
    );
};

export default TechnicalRoundPage;
