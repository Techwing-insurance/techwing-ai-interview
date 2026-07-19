import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAvatar from '../components/VoiceAvatar';
import TechWingLoader from '../components/TechWingLoader';
import { useVAD } from '../hooks/useVAD';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Clock } from 'lucide-react';

const TechnicalRoundPage = () => {
    const navigate = useNavigate();
    const { setSessionId, setCurrentRound } = useInterview();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleSpeechEnd = async (audioBlob) => {
        if (!audioBlob) return;
        setIsProcessing(true);
        
        try {
            // 1. Send Audio to Whisper for Transcription
            const audioFormData = new FormData();
            audioFormData.append('audio', audioBlob, 'answer.webm');
            
            let userTranscript = "Transcription skipped / fallback.";
            try {
                const transcribeRes = await interviewService.transcribeVoice(audioFormData, 'TECHNICAL');
                userTranscript = transcribeRes.data;
            } catch (e) {
                console.warn("Transcription failed, using fallback text.", e);
            }

            setTranscript(userTranscript);

            // 2. Send JSON payload to Backend
            const currentSessionData = sessionDataRef.current;
            const currentQuestion = questionRef.current;

            const payload = {
                sessionId: currentSessionData?.sessionId,
                questionOrder: currentQuestion?.order,
                transcript: userTranscript
            };

            const res = await interviewService.answerTechnicalQuestion(payload);
            const evalData = res.data.data;
            
            setFeedback(evalData.feedback);
            
            // Speak the feedback first, THEN move on
            await speak(evalData.feedback);
            
            // 3. Process Next or Complete
            if (evalData.nextAvailable) {
                if (currentSessionData?.sessionId) fetchNextQuestion(currentSessionData.sessionId);
            } else {
                setFeedback('Technical Round Complete! Moving to HR Round...');
                setTimeout(() => navigate('/interview/hr'), 2500);
            }

        } catch (err) {
            console.error('Error submitting answer', err);
            setFeedback('Error processing your answer. Please try again.');
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
    
    // Timer states
    const [timeLeft, setTimeLeft] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    
    const audioRef = useRef(null);

    useEffect(() => {
        const initInterview = async () => {
            try {
                const res = await interviewService.startTechnicalRound();
                const data = res.data.data;
                setSessionData(data);
                setSessionId(data.sessionId);
                setCurrentRound('TECHNICAL');
                
                if (data.timeLimitMinutes) {
                    // Set to 5 minutes as requested
                    setTimeLeft(5 * 60);
                }

                setQuestion({
                    id: data.questionId,
                    order: data.questionOrder,
                    text: data.questionText
                });
                
                await speak("Hello, let's start the technical interview. " + data.questionText);
                startRecording();
            } catch (err) {
                console.error('Failed to start interview', err);
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
        
        // Auto-navigate after 3 seconds
        setTimeout(() => {
            navigate('/interview/hr');
        }, 3000);
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
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsSpeaking(false);
        startRecording();
    };

    const handleStopRecording = () => {
        stopRecording();
    };

    const fetchNextQuestion = async (sessionId) => {
        try {
            const res = await interviewService.getNextTechnicalQuestion(sessionId);
            const data = res.data.data;
            setQuestion({
                id: data.questionId,
                order: data.order,
                text: data.questionText
            });
            await speak(data.questionText);
            startRecording();
        } catch (error) {
            console.error("Failed to fetch next question", error);
        }
    };

    if (!question) {
        return (
            <div className="min-h-screen bg-techwing-dark flex items-center justify-center">
                <TechWingLoader text="Initializing Technical Round..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark flex flex-col relative">
            
            {/* Time's Up Modal */}
            {isTimeUp && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="glass-panel p-8 text-center max-w-md">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Time is up!</h2>
                        <p className="text-gray-300">Submitting your answers and moving to the HR round...</p>
                        <Loader2 className="w-6 h-6 text-techwing-gold animate-spin mx-auto mt-6" />
                    </div>
                </div>
            )}

            <header className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* TechWing Logo (Placeholder) */}
                    <div className="w-10 h-10 bg-techwing-gold/20 rounded-xl flex items-center justify-center border border-techwing-gold/30">
                        <span className="text-techwing-gold font-bold text-xl">TW</span>
                    </div>
                    <h1 className="text-2xl font-bold text-techwing-gold hidden sm:block">TechWing AI</h1>
                </div>
                
                {/* Timer UI */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-6">
                <div className="glass-panel p-12 flex-1 w-full max-w-2xl text-center flex flex-col items-center justify-center min-h-[500px]">
                    <h2 className="text-2xl text-techwing-gold mb-8 font-bold">AI Interviewer</h2>
                    <VoiceAvatar 
                        isListening={isRecording}
                        isSpeaking={isSpeaking}
                        isProcessing={isProcessing}
                        volume={volume}
                        onStartListening={handleStartRecording}
                        onStopListening={handleStopRecording}
                    />
                    <p className="mt-8 text-gray-400 text-sm">
                        {isSpeaking ? "Interviewer is speaking..." : isRecording ? "Listening to your answer..." : isProcessing ? "Processing your answer..." : "Click to speak"}
                    </p>
                </div>
            </main>
            <audio ref={audioRef} className="hidden" />
        </div>
    );
};

export default TechnicalRoundPage;
