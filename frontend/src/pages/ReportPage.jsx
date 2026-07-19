import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Loader2, Download, Home, Star, FileText, Users, TrendingUp, AlertCircle } from 'lucide-react';
import TechWingLoader from '../components/TechWingLoader';

const ScoreBar = ({ label, score, color }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="font-bold text-white">{typeof score === 'number' ? score.toFixed(1) : 'N/A'}/10</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, ((score || 0) / 10) * 100)}%`, background: color || '#CAA928' }}
            />
        </div>
    </div>
);

const ReportPage = () => {
    const navigate = useNavigate();
    const { sessionId, setSessionId } = useInterview();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const effectiveSessionId = sessionId || localStorage.getItem('interviewSessionId');
        if (!effectiveSessionId) {
            navigate('/dashboard');
            return;
        }

        const fetchReport = async () => {
            try {
                setLoading(true);
                setError(null);

                // Step 1: Complete any dangling session state
                try {
                    await interviewService.completeHrRound(effectiveSessionId);
                } catch (e) {
                    // May already be complete, that's fine
                }

                // Step 2: Generate report — triggers AI analysis on backend
                await interviewService.generateReport(effectiveSessionId);

                // Step 3: Poll for report up to 30 seconds
                let reportData = null;
                for (let i = 0; i < 10; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    try {
                        const res = await interviewService.getReport(effectiveSessionId);
                        if (res.data?.data) {
                            reportData = res.data.data;
                            break;
                        }
                    } catch (e) {
                        console.warn(`Attempt ${i + 1} to get report failed`, e);
                    }
                }

                if (reportData) {
                    setReport(reportData);
                } else {
                    setError('Report generation is taking longer than expected. Click Retry below.');
                }
            } catch (err) {
                console.error('Failed to get report', err);
                setError('Could not generate your report. This may happen if no answers were recorded. Please try again or return to the dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [navigate, retryCount]);

    if (loading) {
        return (
            <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center gap-6 p-6">
                <TechWingLoader text="Analyzing Your Interview..." />
                <p className="text-gray-400 text-center max-w-sm">
                    Our AI is reviewing your answers and generating your comprehensive performance report. This may take up to 30 seconds.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center space-y-6 p-6">
                <div className="glass-panel p-8 text-center max-w-md w-full">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-500 mb-3">Report Generation Failed</h2>
                    <p className="text-gray-300 text-sm mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setRetryCount(c => c + 1)} className="btn-primary">
                            Retry
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center space-y-6 p-6">
                <div className="glass-panel p-8 text-center max-w-md w-full">
                    <h2 className="text-xl font-bold text-yellow-500 mb-3">No Report Found</h2>
                    <p className="text-gray-300 text-sm mb-6">We couldn't find a report for this session. Please ensure you completed the interview.</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const overallScore = report.overallScore ?? 0;
    const technicalScore = report.technicalScore ?? 0;
    const hrScore = report.hrScore ?? 0;

    // Parse JSON string arrays from backend
    const parseJsonArray = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        try { return JSON.parse(str); } catch { return [str]; }
    };
    const strengthsList = parseJsonArray(report.strengths);
    const weaknessesList = parseJsonArray(report.weaknesses);

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex justify-between items-center py-6 mb-8 border-b border-white/10">
                <img
                    src="/src/assets/logo.png"
                    alt="TechWing"
                    className="h-10 object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50/0a0a0a/CAA928?text=TECHWING'; }}
                />
                <div className="flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Download / Print
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2">
                        <Home className="w-4 h-4" /> Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left — Score Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-techwing-gold/10 rounded-full blur-[50px]"></div>
                            <h3 className="text-xl font-bold mb-6">Overall Score</h3>
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="transparent" />
                                    <circle
                                        cx="80" cy="80" r="70"
                                        stroke="#CAA928"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray="440"
                                        strokeDashoffset={440 - (440 * (overallScore / 10))}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-4xl font-bold text-white">{overallScore.toFixed(1)}</span>
                                    <span className="text-sm text-gray-400">out of 10</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <ScoreBar label="Technical" score={technicalScore} color="#CAA928" />
                                <ScoreBar label="HR / Soft Skills" score={hrScore} color="#60a5fa" />
                            </div>
                        </div>

                        {/* Verdict */}
                        <div className={`glass-panel p-6 text-center border-2 ${
                            overallScore >= 7 ? 'border-green-500/50 bg-green-500/5' :
                            overallScore >= 5 ? 'border-yellow-500/50 bg-yellow-500/5' :
                            'border-red-500/50 bg-red-500/5'
                        }`}>
                            <h3 className="font-bold text-lg mb-2">Verdict</h3>
                            <p className={`text-2xl font-bold ${
                                overallScore >= 7 ? 'text-green-400' :
                                overallScore >= 5 ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                                {overallScore >= 7 ? '✅ Recommended' : overallScore >= 5 ? '⚠️ Needs Improvement' : '❌ Not Recommended'}
                            </p>
                        </div>
                    </div>

                    {/* Right — Detailed Feedback */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* AI Executive Summary */}
                        <div className="glass-panel p-8">
                            <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-techwing-gold" /> AI Executive Summary
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                {report.aiSummary || "The candidate demonstrated foundational knowledge in their technology track. Performance data has been saved for trainer review."}
                            </p>
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 border-t-4 border-t-green-500">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-green-400" /> Top Strengths
                                </h3>
                                <ul className="list-disc pl-5 text-gray-300 space-y-2">
                                    {(strengthsList.length > 0
                                        ? strengthsList
                                        : ['Interview completed successfully', 'Answers were recorded and saved', 'Performance data stored for review']
                                    ).map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>

                            <div className="glass-panel p-6 border-t-4 border-t-red-500">
                                <h3 className="text-lg font-bold mb-4 text-red-400">Areas to Improve</h3>
                                <ul className="list-disc pl-5 text-gray-300 space-y-2">
                                    {(weaknessesList.length > 0
                                        ? weaknessesList
                                        : ['Continue practicing core concepts', 'Work on explaining concepts with examples', 'Review advanced topics in your track']
                                    ).map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </div>

                        {/* Learning Roadmap */}
                        {report.learningRoadmap && (
                            <div className="glass-panel p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-techwing-gold" /> Personalized Learning Roadmap
                                </h3>
                                <p className="text-gray-300 leading-relaxed">{report.learningRoadmap}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportPage;
