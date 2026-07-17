import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAvatar from '../components/VoiceAvatar';
import { useVAD } from '../hooks/useVAD';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Loader2 } from 'lucide-react';

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
            const payload = {
                sessionId: sessionData?.sessionId,
                questionOrder: question?.order,
                transcript: userTranscript
            };

            const res = await interviewService.answerTechnicalQuestion(payload);
            const evalData = res.data.data;
            
            setFeedback(evalData.feedback);
            
            // 3. Process Next or Complete
            if (evalData.nextAvailable) {
                if (sessionData?.sessionId) fetchNextQuestion(sessionData.sessionId);
            } else {
                alert("Technical Round Complete! Moving to Coding Round...");
                navigate('/interview/coding');
            }

        } catch (err) {
            console.error('Error submitting answer', err);
            alert('Error processing your answer. Please ensure backend services are running.');
        } finally {
            setIsProcessing(false);
        }
    };

    const { isRecording, startRecording, stopRecording, volume } = useVAD({
        onSpeechEnd: handleSpeechEnd
    });
    
    const [sessionData, setSessionData] = useState(null);
    const [question, setQuestion] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const audioRef = useRef(null);

    useEffect(() => {
        const initInterview = async () => {
            try {
                const res = await interviewService.startTechnicalRound();
                const data = res.data.data;
                setSessionData(data);
                setSessionId(data.sessionId);
                setCurrentRound('TECHNICAL');
                
                setQuestion({
                    id: data.questionId,
                    order: data.questionOrder,
                    text: data.questionText
                });
                
                speak("Hello, let's start the technical interview. " + data.questionText);
            } catch (err) {
                console.error('Failed to start interview', err);
            }
        };
        initInterview();
    }, []);

    const speak = (text) => {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleStartRecording = () => {
        window.speechSynthesis.cancel(); 
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
            speak(data.questionText);
        } catch (error) {
            console.error("Failed to fetch next question", error);
        }
    };

    if (!question) {
        return (
            <div className="min-h-screen bg-techwing-dark flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-techwing-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark flex flex-col">
            <header className="p-6 border-b border-white/10 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-techwing-gold">Technical Round</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/interview/coding')} className="btn-secondary text-sm">
                        Skip to Next Round
                    </button>
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
