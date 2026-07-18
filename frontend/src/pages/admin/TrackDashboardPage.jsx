import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrack, getTrackStudentsPerformance, getTrackConfig, updateTrackConfig } from '../../services/adminService';
import { ArrowLeft, Users, Activity, Settings, Clock, Loader2, X, Save } from 'lucide-react';
import TechWingLoader from '../../components/TechWingLoader';
import Swal from 'sweetalert2';

const TrackDashboardPage = () => {
    const { trackId } = useParams();
    const navigate = useNavigate();
    const [track, setTrack] = useState(null);
    const [students, setStudents] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editConfig, setEditConfig] = useState({ technicalTimeMinutes: 5, technicalQuestionCount: 10 });
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        fetchTrackData();
    }, [trackId]);

    const fetchTrackData = async () => {
        try {
            const [trackRes, studentsRes, configRes] = await Promise.all([
                getTrack(trackId),
                getTrackStudentsPerformance(trackId),
                getTrackConfig(trackId).catch(() => null)
            ]);
            setTrack(trackRes.data?.data);
            setStudents(studentsRes.data?.data || []);
            if (configRes?.data?.data) {
                setConfig(configRes.data.data);
                setEditConfig({
                    technicalTimeMinutes: configRes.data.data.technicalTimeMinutes,
                    technicalQuestionCount: configRes.data.data.technicalQuestionCount || 10
                });
            }
        } catch (err) {
            console.error("Failed to fetch track data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const res = await updateTrackConfig(trackId, editConfig);
            setConfig(res.data.data);
            setShowSettingsModal(false);
            
            Swal.fire({
                title: 'Settings Saved',
                text: 'Track configuration updated successfully.',
                icon: 'success',
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#CAA928'
            });
            
        } catch (err) {
            console.error("Failed to update config", err);
            setShowSettingsModal(false);
            Swal.fire({
                title: 'Failed to Save',
                text: err.response?.data?.message || 'An error occurred while saving the settings.',
                icon: 'error',
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#e3342f'
            });
        } finally {
            setSavingConfig(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-techwing-dark">
                <TechWingLoader text="Loading Dashboard..." />
            </div>
        );
    }

    if (!track) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-techwing-dark text-white">
                Track not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            <header className="max-w-6xl mx-auto flex items-center gap-4 mb-10">
                <button 
                    onClick={() => navigate('/admin')}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-techwing-gold to-techwing-orange bg-clip-text text-transparent">
                        {track.name} Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">{track.description}</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Stats & Settings Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-techwing-orange" /> Track Stats
                        </h2>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Enrolled Students</p>
                                <p className="text-2xl font-bold">{students.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" /> Configuration
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Technical Round Time Limit</label>
                                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                    <Clock className="w-4 h-4 text-techwing-gold" />
                                    <span className="text-white">{config?.technicalTimeMinutes || 5} Minutes</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSettingsModal(true)}
                                className="btn-secondary w-full text-sm"
                            >
                                Edit Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Enrolled Students */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-techwing-gold" /> Enrolled Students
                        </h2>
                        
                        {students.length === 0 ? (
                            <p className="text-gray-500">No students are enrolled in this track yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                                            <th className="py-3 px-4 font-medium">Name / PIN</th>
                                            <th className="py-3 px-4 font-medium">Branch / Year</th>
                                            <th className="py-3 px-4 font-medium text-right">Latest Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-white">{student.name}</div>
                                                    <div className="text-xs text-gray-400">{student.pinNumber || 'No PIN'}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm">{student.branch || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-400">Year: {student.year || '-'}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {student.overallScore !== null && student.overallScore !== undefined ? (
                                                        <div className="font-bold text-techwing-gold">
                                                            {student.overallScore.toFixed(1)}/100
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 text-sm">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-techwing-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-techwing-gold" /> Track Settings
                            </h3>
                            <button 
                                onClick={() => setShowSettingsModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Technical Round Time Limit (Minutes)
                                </label>
                                <input 
                                    type="number" 
                                    min="1"
                                    max="60"
                                    className="input-field w-full"
                                    value={editConfig.technicalTimeMinutes}
                                    onChange={(e) => setEditConfig({...editConfig, technicalTimeMinutes: parseInt(e.target.value) || 0})}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    The interview will automatically end and redirect to HR round when this timer expires.
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                            <button 
                                onClick={() => setShowSettingsModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                disabled={savingConfig}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                {savingConfig ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackDashboardPage;
