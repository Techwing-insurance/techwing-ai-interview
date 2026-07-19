import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Activity, Calendar, ArrowLeft, TrendingUp, Star, ClipboardList } from 'lucide-react';
import api from '../../services/api';
import TechWingLoader from '../../components/TechWingLoader';

const ScoreBar = ({ label, score, max = 10 }) => {
    const pct = Math.min(100, ((score || 0) / max) * 100);
    const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{score != null ? score.toFixed(1) : '—'} / {max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const RecommendationBadge = ({ value }) => {
    const map = {
        STRONGLY_RECOMMENDED: { label: 'Strongly Recommended', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
        RECOMMENDED: { label: 'Recommended', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        NEUTRAL: { label: 'Neutral', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
        NOT_RECOMMENDED: { label: 'Not Recommended', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    };
    const item = map[value] || { label: value || 'Pending', cls: 'bg-white/5 text-gray-400 border-white/10' };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${item.cls}`}>
            {item.label}
        </span>
    );
};

const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    if (Array.isArray(dateVal) && dateVal.length >= 3) {
        // Spring Boot LocalDateTime array format: [year, month, day, hour, min, sec]
        const date = new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AdminStudentProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/admin/students/${userId}`);
                setProfile(res.data.data);
            } catch (err) {
                console.error('Error fetching student profile:', err);
                setError('Failed to load student profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-techwing-dark flex justify-center items-center">
                <TechWingLoader text="Loading Profile..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-techwing-dark flex justify-center items-center p-6">
                <div className="glass-panel p-10 text-center max-w-sm w-full">
                    <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Could not load profile</h2>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button onClick={() => navigate(-1)} className="btn-secondary w-full">← Go Back</button>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const hasReports = profile.pastReports && profile.pastReports.length > 0;

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            <div className="max-w-6xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Track
                </button>

                {/* Profile Header */}
                <div className="glass-panel p-8 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-techwing-gold/10 border-2 border-techwing-gold/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-10 h-10 text-techwing-gold" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                    <span>{profile.email}</span>
                                    {profile.pinNumber && <><span>·</span><span>PIN: {profile.pinNumber}</span></>}
                                    {profile.branch && <><span>·</span><span>{profile.branch}</span></>}
                                    {profile.year && <><span>·</span><span>Year {profile.year}</span></>}
                                    {profile.college && <><span>·</span><span>{profile.college}</span></>}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-techwing-gold">{profile.totalInterviews}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Interviews</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-techwing-gold">
                                    {profile.averageOverallScore > 0 ? profile.averageOverallScore.toFixed(1) : '—'}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg Score</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Past Reports */}
                <div className="flex items-center gap-3 mb-5">
                    <Activity className="w-5 h-5 text-techwing-gold" />
                    <h2 className="text-xl font-bold text-white">Interview History</h2>
                    {hasReports && (
                        <span className="bg-techwing-gold/10 text-techwing-gold text-xs px-2 py-0.5 rounded-full border border-techwing-gold/20">
                            {profile.pastReports.length} report{profile.pastReports.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {hasReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profile.pastReports.map((report, idx) => (
                            <div key={report.id} className="glass-panel p-6 hover:bg-white/5 transition-colors">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(report.generatedAt)}
                                        </div>
                                        <RecommendationBadge value={report.recommendation} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-techwing-gold">
                                            {report.overallScore != null ? report.overallScore.toFixed(1) : '—'}
                                        </div>
                                        <div className="text-xs text-gray-500">/ 10</div>
                                    </div>
                                </div>

                                {/* Score bars */}
                                <div className="space-y-3 mb-5">
                                    <ScoreBar label="Technical" score={report.technicalScore} />
                                    <ScoreBar label="HR" score={report.hrScore} />
                                </div>

                                {/* Summary snippet */}
                                {report.aiSummary && (
                                    <div className="text-xs text-gray-500 italic border-t border-white/5 pt-4 leading-relaxed line-clamp-3">
                                        {report.aiSummary}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Beautiful empty state */
                    <div className="glass-panel p-16 text-center">
                        <div className="w-20 h-20 bg-techwing-gold/5 border border-techwing-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrendingUp className="w-10 h-10 text-techwing-gold/40" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No interviews yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                            {profile.name} hasn't completed any interviews yet. Once they finish a technical and HR round, their reports will appear here.
                        </p>
                        <div className="mt-8 flex justify-center gap-3">
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-400">
                                <Star className="w-4 h-4 text-techwing-gold/50" /> Technical Round
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-400">
                                <Star className="w-4 h-4 text-techwing-gold/50" /> HR Round
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStudentProfilePage;
