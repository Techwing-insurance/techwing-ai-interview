import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Loader2, Eye, EyeOff, Hash, BookOpen, GraduationCap } from 'lucide-react';
import api from '../services/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        pinNumber: '',
        year: 1,
        branch: 'Computer Science', 
        trackId: '' 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [tracksError, setTracksError] = useState('');
    
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const res = await api.get('/public/tracks');
                if (res.data.success && res.data.data.length > 0) {
                    setTracks(res.data.data);
                    // Default select the first track
                    setFormData(prev => ({ ...prev, trackId: res.data.data[0].id }));
                } else {
                    setTracksError('No technology tracks found. Please contact admin.');
                }
            } catch (err) {
                console.error("Failed to load tracks", err);
                setTracksError('Failed to load technology tracks. Please refresh the page.');
            }
        };
        fetchTracks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(formData);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-techwing-dark px-4 py-8">
            <div className="w-full max-w-md glass-panel p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-gray-400">Join TechWing to start practicing</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="text" 
                                required
                                className="input-field !pl-10" 
                                placeholder="shanmukh"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="email" 
                                required
                                className="input-field !pl-10" 
                                placeholder="shanmukh@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                minLength="6"
                                className="input-field !pl-10 pr-10" 
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number (PIN)</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input 
                                    type="text" 
                                    required
                                    className="input-field !pl-10" 
                                    placeholder="Enter Roll Number"
                                    value={formData.pinNumber}
                                    onChange={e => setFormData({...formData, pinNumber: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <select 
                                    required
                                    className="input-field !pl-10 appearance-none" 
                                    value={formData.year}
                                    onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                                >
                                    <option value={1}>1st Year</option>
                                    <option value={2}>2nd Year</option>
                                    <option value={3}>3rd Year</option>
                                    <option value={4}>4th Year</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <select 
                                required
                                className="input-field !pl-10 appearance-none" 
                                value={formData.branch}
                                onChange={e => setFormData({...formData, branch: e.target.value})}
                            >
                                <option value="Computer Science">Computer Science & Engineering (CSE)</option>
                                <option value="CSE - Data Science (CSD)">CSE - Data Science (CSD)</option>
                                <option value="CSE - AI & ML (CSM)">CSE - AI & ML (CSM)</option>
                                <option value="CSE - Cyber Security (CSC)">CSE - Cyber Security (CSC)</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Electronics & Communication">Electronics & Communication</option>
                                <option value="Electrical & Electronics">Electrical & Electronics</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Technology Track</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <select 
                                required
                                className="input-field !pl-10 appearance-none" 
                                value={formData.trackId}
                                onChange={e => setFormData({...formData, trackId: parseInt(e.target.value)})}
                            >
                                {tracks.length === 0 && <option value="" disabled>Loading tracks...</option>}
                                {tracks.map(track => (
                                    <option key={track.id} value={track.id}>{track.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {tracksError && <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-3 rounded-lg text-sm">{tracksError}</div>}

                    <button type="submit" disabled={loading || !formData.trackId} className="btn-primary w-full flex justify-center mt-6">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-techwing-orange hover:underline">Sign in here</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
