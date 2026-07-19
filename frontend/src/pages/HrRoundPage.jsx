import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAvatar from '../components/VoiceAvatar';
import TechWingLoader from '../components/TechWingLoader';
import { useVAD } from '../hooks/useVAD';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Clock, Users } from 'lucide-react';

const HrRoundPage = () => {
    const navigate = useNavigate();
    const { setSessionId, setCurrentRound } = useInterview();
    const [isProcessing, setIsProcessing] = useState(false);

    // Timer state — 20 min default
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const handleSpeechEnd = async (audioBlob) => {
        if (!audioBlob) return;
        setIsProcessing(true);

        try {
            // 1. Send Audio to Whisper for Transcription
            const audioFormData = new FormData();
            audioFormData.append('audio', audioBlob, 'answer.webm');

            let userTranscript = "No response given.";
            try {
                const transcribeRes = await interviewService.transcribeVoice(audioFormData, 'HR');
                userTranscript = transcribeRes.data;
            } catch (e) {
                console.warn("Transcription failed, using fallback text.", e);
            }

            setTranscript(userTranscript);

            // 2. Send JSON payload to Backend for AI evaluation
            const currentSessionData = sessionDataRef.current;
            const currentQuestion = questionRef.current;

            const payload = {
                sessionId: currentSessionData?.sessionId,
                questionOrder: currentQuestion?.order,
                transcript: userTranscript
            };

            const res = await interviewService.answerHrQuestion(payload);
            const evalData = res.data.data;

            setFeedback(evalData.feedback);

            // Speak feedback, then move on
            await speak(evalData.feedback);

            // Always fetch next (infinite mode — timer controls end)
            if (currentSessionData?.sessionId) {
                fetchNextQuestion(currentSessionData.sessionId);
            }

        } catch (err) {
            console.error('Error submitting HR answer', err);
            setFeedback('There was an issue processing your answer. Let us move on.');
        } finally {
            setIsProcessing(false);
        }
    };

    const { isRecording, startRecording, stopRecording, volume } = useVAD({
        onSpeechEnd: handleSpeechEnd
    });

    const [sessionData, setSessionDataState] = useState(null);
    const [question, setQuestionState] = useState(null);
    const sessionDataRef = useRef(null);
    const questionRef = useRef(null);

    const setSessionData = (data) => {
        sessionDataRef.current = data;
        setSessionDataState(data);
    };

    const setQuestion = (data) => {
        questionRef.current = data;
        setQuestionState(data);
    };

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');
    const audioRef = useRef(null);

    useEffect(() => {
        const initInterview = async () => {
            try {
                const res = await interviewService.startHrRound();
                const data = res.data.data;
                setSessionData(data);
                setSessionId(data.sessionId);
                setCurrentRound('HR');

                // Set timer from config (fallback: 20 minutes)
                const minutes = data.timeLimitMinutes || 20;
                setTimeLeft(minutes * 60);

                setQuestion({
                    id: data.questionId,
                    order: data.questionOrder,
                    text: data.questionText
                });

                await speak("Hello! Welcome to the HR round. I'm Priya, your HR interviewer. " + data.questionText);
                startRecording();
            } catch (err) {
                console.error('Failed to start HR round', err);
                setFeedback('Failed to start HR round. Please check that all services are running.');
            }
        };
        initInterview();
    }, []);

    // Timer Effect
    useEffect(() => {
        if (timeLeft === null || isTimeUp) return;

        if (timeLeft <= 0) {
            handleTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isTimeUp]);

    const handleTimeUp = () => {
        setIsTimeUp(true);
        stopRecording();
        if (audioRef.current) audioRef.current.pause();
        setTimeout(() => navigate('/report'), 3000);
    };

    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const speak = (text) => {
        return new Promise(async (resolve) => {
            setIsSpeaking(true);
            try {
                // Use Spring Boot proxy — works in production on mobile
                const token = localStorage.getItem('token');
                const response = await fetch('/api/voice/speak', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text, voice: 'female' })
                });
                if (!response.ok) throw new Error('TTS Failed');

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (audioRef.current) {
                    audioRef.current.pause();
                }
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => {
                    setIsSpeaking(false);
                    resolve();
                };
                audio.onerror = (e) => {
                    console.error('Audio playback error', e);
                    setIsSpeaking(false);
                    resolve();
                };

                await audio.play();
            } catch (err) {
                console.error('TTS error', err);
                setIsSpeaking(false);
                resolve();
            }
        });
    };

    const handleStartRecording = () => {
        if (audioRef.current) audioRef.current.pause();
        setIsSpeaking(false);
        startRecording();
    };

    const handleStopRecording = () => stopRecording();

    const fetchNextQuestion = async (sessionId) => {
        setTranscript('');
        setFeedback('');
        try {
            const res = await interviewService.getNextHrQuestion(sessionId);
            const data = res.data.data;
            setQuestion({
                id: data.questionId,
                order: data.order,
                text: data.questionText
            });
            await speak(data.questionText);
            startRecording();
        } catch (error) {
            console.error("Failed to fetch next HR question", error);
            setFeedback("We have completed your HR assessment. Thank you!");
            setTimeout(() => navigate('/report'), 3000);
        }
    };

    if (!question) {
        return (
            <div className="min-h-screen bg-techwing-dark flex items-center justify-center">
                <TechWingLoader text="Initializing HR Round..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark flex flex-col relative">

            {/* Time's Up Overlay */}
            {isTimeUp && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="glass-panel p-8 text-center max-w-md">
                        <div className="w-16 h-16 bg-techwing-orange/20 text-techwing-orange rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">HR Round Complete!</h2>
                        <p className="text-gray-300">Generating your interview report...</p>
                        <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-techwing-gold rounded-full animate-pulse w-3/4"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-techwing-orange/20 rounded-xl flex items-center justify-center border border-techwing-orange/30">
                        <Users className="w-5 h-5 text-techwing-orange" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">HR Round</h1>
                        <p className="text-xs text-gray-400">Question {question.order}</p>
                    </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-medium ${
                    timeLeft !== null && timeLeft < 120
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-gray-300'
                }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col lg:flex-row items-center justify-center p-6 gap-8">

                {/* Left — Voice Avatar */}
                <div className="glass-panel p-8 w-full max-w-sm text-center flex flex-col items-center">
                    <h2 className="text-lg font-bold text-techwing-orange mb-6">Priya — HR Interviewer</h2>
                    <VoiceAvatar
                        isListening={isRecording}
                        isSpeaking={isSpeaking}
                        isProcessing={isProcessing}
                        volume={volume}
                        onStartListening={handleStartRecording}
                        onStopListening={handleStopRecording}
                    />
                    <p className="mt-6 text-gray-400 text-sm">
                        {isSpeaking
                            ? "Priya is speaking..."
                            : isRecording
                            ? "Listening to your answer..."
                            : isProcessing
                            ? "Evaluating your response..."
                            : "Click the mic to speak"}
                    </p>
                </div>

                {/* Right — Question & Feedback */}
                <div className="flex-1 w-full max-w-xl space-y-5">
                    {/* Question */}
                    <div className="glass-panel p-6">
                        <h3 className="text-gray-400 mb-3 uppercase text-xs tracking-widest font-semibold flex items-center gap-2">
                            <span className="w-5 h-5 bg-techwing-orange text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {question.order}
                            </span>
                            HR Question
                        </h3>
                        <p className="text-xl leading-relaxed text-white">{question.text}</p>
                    </div>

                    {/* Your Answer */}
                    {transcript && (
                        <div className="glass-panel p-5 border-l-4 border-l-techwing-gold">
                            <h3 className="text-gray-400 mb-2 uppercase text-xs tracking-widest font-semibold">Your Answer</h3>
                            <p className="text-gray-200 italic">"{transcript}"</p>
                        </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <div className="bg-techwing-orange/10 border border-techwing-orange/30 p-5 rounded-2xl">
                            <h3 className="text-techwing-orange mb-2 uppercase text-xs tracking-widest font-bold">Interviewer Feedback</h3>
                            <p className="text-gray-200">{feedback}</p>
                        </div>
                    )}

                    {/* Skip / Finish buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                if (sessionData?.sessionId) fetchNextQuestion(sessionData.sessionId);
                            }}
                            disabled={isProcessing || isSpeaking}
                            className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                        >
                            Skip Question
                        </button>
                        <button
                            onClick={() => navigate('/report')}
                            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
                        >
                            End Interview
                        </button>
                    </div>
                </div>
            </main>
            <audio ref={audioRef} className="hidden" />
        </div>
    );
};

export default HrRoundPage;
