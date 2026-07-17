import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceAvatar from '../components/VoiceAvatar';
import { useVAD } from '../hooks/useVAD';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Loader2 } from 'lucide-react';

const HrRoundPage = () => {
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
                const transcribeRes = await interviewService.transcribeVoice(audioFormData, 'HR');
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

            const res = await interviewService.answerHrQuestion(payload);
            const evalData = res.data.data;
            
            setFeedback(evalData.feedback);
            
            // 3. Process Next or Complete
            if (evalData.nextAvailable) {
                setTimeout(() => {
                    if (sessionData?.sessionId) fetchNextQuestion(sessionData.sessionId);
                }, 4000);
            } else {
                setTimeout(() => {
                    alert("Interview Complete! Generating Report...");
                    navigate('/report');
                }, 4000);
            }

        } catch (err) {
            console.error('Error submitting answer', err);
            alert('Error processing your answer');
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
                
                setQuestion({
                    id: data.questionId,
                    order: data.questionOrder,
                    text: data.questionText
                });
                
                speak(data.questionText);
            } catch (err) {
                console.error('Failed to start HR round', err);
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
        if (audioRef.current) audioRef.current.pause();
        setIsSpeaking(false);
        startRecording();
    };

    const handleStopRecording = () => {
        stopRecording();
    };

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
                <h1 className="text-2xl font-bold text-techwing-orange">HR Round</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/report')} className="btn-secondary text-sm">
                        Finish Interview
                    </button>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row items-center justify-center p-6 gap-12">
                <div className="glass-panel p-8 flex-1 w-full max-w-xl text-center">
                    <VoiceAvatar 
                        isListening={isRecording}
                        isSpeaking={isSpeaking}
                        isProcessing={isProcessing}
                        volume={volume}
                        onStartListening={handleStartRecording}
                        onStopListening={handleStopRecording}
                    />
                </div>

                <div className="flex-1 w-full max-w-xl space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-gray-400 mb-2 uppercase text-sm tracking-wider">AI Interviewer - Question {question.order}</h3>
                        <p className="text-xl leading-relaxed">{question.text}</p>
                    </div>

                    {transcript && (
                        <div className="glass-panel p-6 border-l-4 border-l-techwing-gold">
                            <h3 className="text-gray-400 mb-2 uppercase text-sm tracking-wider">You Said</h3>
                            <p className="text-lg italic text-gray-300">"{transcript}"</p>
                        </div>
                    )}

                    {feedback && (
                        <div className="bg-techwing-orange/10 border border-techwing-orange/30 p-6 rounded-2xl">
                            <h3 className="text-techwing-orange mb-2 uppercase text-sm tracking-wider font-bold">Feedback</h3>
                            <p className="text-gray-300">{feedback}</p>
                        </div>
                    )}
                </div>
            </main>
            <audio ref={audioRef} className="hidden" />
        </div>
    );
};

export default HrRoundPage;
