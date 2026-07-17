import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Loader2 } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', pin: '', role: 'USER', branch: 'Computer Science', phone: '0000000000', college: 'TechWing University', trackId: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

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
                                className="input-field pl-10" 
                                placeholder="John Doe"
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
                                className="input-field pl-10" 
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">6-Digit PIN</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="password" 
                                required
                                maxLength="6"
                                minLength="6"
                                pattern="\d{6}"
                                className="input-field pl-10" 
                                placeholder="123456"
                                value={formData.pin}
                                onChange={e => setFormData({...formData, pin: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Technology Track</label>
                        <select 
                            required
                            className="input-field" 
                            value={formData.trackId}
                            onChange={e => setFormData({...formData, trackId: parseInt(e.target.value)})}
                        >
                            <option value={1}>Java Full Stack</option>
                            <option value={2}>Python Data Science</option>
                            <option value={3}>Frontend React</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center mt-6">
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
