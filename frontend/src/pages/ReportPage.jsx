import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as interviewService from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import { Loader2, Download, Home, Star, FileText, Code, Users } from 'lucide-react';
import TechWingLoader from '../components/TechWingLoader';

const ReportPage = () => {
    const navigate = useNavigate();
    const { sessionId } = useInterview();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!sessionId) {
                navigate('/dashboard');
                return;
            }
            try {
                // Generate report (async on backend)
                await interviewService.generateReport(sessionId);
                // In a real app, you might poll or wait for WebSocket. 
                // For now, we simulate waiting a bit then fetching
                setTimeout(async () => {
                    const res = await interviewService.getReport(sessionId);
                    setReport(res.data.data);
                    setLoading(false);
                }, 5000);
            } catch (err) {
                console.error('Failed to get report', err);
                setLoading(false);
            }
        };
        fetchReport();
    }, [sessionId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center">
                <TechWingLoader text="Analyzing Your Interview..." />
                <p className="text-gray-400 mt-2 text-center">Our AI is generating your comprehensive report<br/>and personalized roadmap.</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center space-y-6">
                <h2 className="text-2xl font-bold text-red-500">Failed to generate report</h2>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            <header className="max-w-6xl mx-auto flex justify-between items-center py-6 mb-8 border-b border-white/10">
                <img src="/src/assets/logo.png" alt="TechWing" className="h-10 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50/0a0a0a/CAA928?text=TECHWING' }} />
                <div className="flex gap-4">
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2">
                        <Home className="w-4 h-4" /> Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-techwing-gold/10 rounded-full blur-[50px]"></div>
                        <h3 className="text-xl font-bold mb-6">Overall Performance</h3>
                        <div className="relative inline-flex items-center justify-center">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="transparent" />
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="#CAA928" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                    strokeDasharray="440"
                                    strokeDashoffset={440 - (440 * (report.overallScore / 10))}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-bold text-white">{report.overallScore?.toFixed(1)}</span>
                                <span className="text-sm text-gray-400">out of 10</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-techwing-gold" /> Technical</div>
                                <span className="font-bold">{report.technicalScore?.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                <div className="flex items-center gap-2"><Code className="w-4 h-4 text-techwing-orange" /> Coding</div>
                                <span className="font-bold">{report.codingScore?.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> HR / Fit</div>
                                <span className="font-bold">{report.hrScore?.toFixed(1)}/10</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Feedback */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-8">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">AI Executive Summary</h2>
                        <p className="text-gray-300 leading-relaxed">{report.aiSummary || "You demonstrated solid foundational skills but struggled with advanced system design scenarios. Your coding logic is sound, but efficiency can be improved."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-panel p-6 border-t-4 border-t-green-500">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-green-500" /> Top Strengths
                            </h3>
                            <ul className="list-disc pl-5 text-gray-300 space-y-2">
                                {(report.strengths || ['Clear communication', 'Solid core Java concepts', 'Problem-solving approach']).map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="glass-panel p-6 border-t-4 border-t-red-500">
                            <h3 className="text-lg font-bold mb-4 text-red-500">Areas for Improvement</h3>
                            <ul className="list-disc pl-5 text-gray-300 space-y-2">
                                {(report.weaknesses || ['Algorithm time complexity optimization', 'System design scalability', 'Handling edge cases in code']).map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportPage;
