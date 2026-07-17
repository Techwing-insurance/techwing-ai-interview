import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as interviewService from '../services/interviewService';
import { Upload, Play, CheckCircle, FileText, Code, Users } from 'lucide-react';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [resumeUploaded, setResumeUploaded] = useState(false);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            await uploadSelectedFile(selectedFile);
        }
    };

    const uploadSelectedFile = async (fileToUpload) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        try {
            await interviewService.uploadResume(formData);
            setResumeUploaded(true);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Resume upload failed. Please try again.');
            setFile(null); // Reset on failure
        } finally {
            setUploading(false);
        }
    };

    const startInterview = () => {
        if (!resumeUploaded) {
            alert('Please upload your resume first to personalize the interview.');
            return;
        }
        navigate('/interview/technical');
    };

    return (
        <div className="min-h-screen bg-techwing-dark p-6">
            <header className="max-w-6xl mx-auto flex justify-between items-center py-6 mb-8 border-b border-white/10">
                <img src="/src/assets/logo.png" alt="TechWing" className="h-10 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50/0a0a0a/CAA928?text=TECHWING' }} />
                <div className="flex items-center gap-6">
                    <span className="text-gray-300">Hello, <strong className="text-white">{user?.name}</strong></span>
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition-colors">Logout</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Setup */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="bg-techwing-orange text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                            Upload Resume
                        </h2>
                        
                        {!resumeUploaded ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-400">Upload your PDF resume to generate tailored technical questions.</p>
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-techwing-gold transition-colors">
                                    <input 
                                        type="file" 
                                        id="resume" 
                                        accept=".pdf"
                                        className="hidden" 
                                        onChange={handleFileChange} 
                                        disabled={uploading}
                                    />
                                    <label htmlFor="resume" className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                                        <Upload className="w-8 h-8 text-techwing-gold mb-2" />
                                        <span className="text-sm font-medium">
                                            {uploading ? 'Uploading & Analyzing...' : (file ? file.name : 'Select PDF File (Auto Upload)')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-green-500">Resume Analyzed</h4>
                                    <p className="text-xs text-gray-400">Your interview is ready.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Instructions */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-8 h-full flex flex-col">
                        <h2 className="text-3xl font-bold mb-6">Interview Instructions</h2>
                        
                        <div className="space-y-6 flex-grow">
                            <div className="flex gap-4 items-start">
                                <div className="bg-techwing-gold/20 p-3 rounded-lg text-techwing-gold mt-1">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Round 1: Technical Interview</h3>
                                    <p className="text-gray-400">A conversational voice interview assessing your domain knowledge based on your resume. You will speak with our AI agent.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="bg-techwing-orange/20 p-3 rounded-lg text-techwing-orange mt-1">
                                    <Code className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Round 2: Live Coding</h3>
                                    <p className="text-gray-400">Data Structures and Algorithms round. Write and execute code in our embedded editor to pass test cases.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 mt-1">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Round 3: HR Interview</h3>
                                    <p className="text-gray-400">Behavioral and situational questions assessing cultural fit and soft skills. Spoken interaction.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={startInterview}
                                className={`btn-primary flex items-center gap-2 text-lg ${!resumeUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Start Interview Now
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
