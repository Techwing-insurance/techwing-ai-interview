import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTracks, addTrack, deleteTrack } from '../../services/adminService';
import { LogOut, Plus, Trash2, Layers, Users, Activity, Loader2 } from 'lucide-react';

const AdminDashboardPage = () => {
    const { user, logout } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTrack, setNewTrack] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const res = await getTracks();
            setTracks(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch tracks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrack = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await addTrack(newTrack);
            setNewTrack({ name: '', description: '' });
            fetchTracks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add track');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTrack = async (id) => {
        if (!window.confirm("Are you sure you want to delete this track?")) return;
        try {
            await deleteTrack(id);
            fetchTracks();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete track');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-techwing-dark">
                <Loader2 className="w-8 h-8 text-techwing-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-techwing-gold to-techwing-orange bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
                </div>
                <button onClick={logout} className="btn-secondary flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Stats Sidebar */}
                <div className="space-y-4">
                    <div className="glass-panel p-6 flex items-center gap-4">
                        <div className="p-3 bg-techwing-gold/10 rounded-lg text-techwing-gold">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Total Tracks</p>
                            <p className="text-2xl font-bold">{tracks.length}</p>
                        </div>
                    </div>
                    
                    <div className="glass-panel p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Registered Students</p>
                            <p className="text-2xl font-bold">--</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Add Track Form */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-techwing-gold" /> Add Technology Track
                        </h2>
                        {error && <div className="text-red-500 mb-4">{error}</div>}
                        <form onSubmit={handleAddTrack} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Track Name</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    required
                                    value={newTrack.name}
                                    onChange={e => setNewTrack({...newTrack, name: e.target.value})}
                                    placeholder="e.g. Cybersecurity"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={newTrack.description}
                                    onChange={e => setNewTrack({...newTrack, description: e.target.value})}
                                    placeholder="Short description..."
                                />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? 'Adding...' : 'Add Track'}
                            </button>
                        </form>
                    </div>

                    {/* Track List */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-techwing-orange" /> Active Technology Tracks
                        </h2>
                        
                        {tracks.length === 0 ? (
                            <p className="text-gray-500">No tracks found. Please add one.</p>
                        ) : (
                            <div className="space-y-3">
                                {tracks.map(track => (
                                    <div key={track.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10 hover:border-techwing-gold/30 transition-colors">
                                        <div>
                                            <h3 className="font-semibold text-white">{track.name}</h3>
                                            <p className="text-sm text-gray-400">{track.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteTrack(track.id)}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
