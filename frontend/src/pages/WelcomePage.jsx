import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Code, FileText, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-techwing-dark px-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-techwing-gold/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-techwing-orange/20 rounded-full blur-[100px] pointer-events-none"></div>

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center z-10"
            >
                {/* Logo Area */}
                <div className="mb-8 flex justify-center">
                    <img src={logoImg} alt="TechWing" className="h-16 object-contain" />
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-techwing-gold to-techwing-orange">TechWing</span><br/>
                    AI Interview Platform
                </h1>
                
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                    Master your interview skills with real-time AI feedback. 
                    Experience realistic Technical and HR rounds tailored to your resume.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                    <button 
                        onClick={() => navigate('/login')}
                        className="btn-primary flex items-center justify-center gap-2 group text-lg"
                    >
                        Start Interview Practice
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={() => navigate('/register')}
                        className="btn-secondary text-lg"
                    >
                        Create Account
                    </button>
                </div>

                {/* Features Grid */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
                >
                    <div className="glass-panel p-6 text-left">
                        <div className="w-12 h-12 bg-techwing-gold/20 rounded-lg flex items-center justify-center mb-4 text-techwing-gold">
                            <FileText />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Resume Parsing</h3>
                        <p className="text-gray-400 text-sm">Upload your resume to get customized questions based on your actual skills and projects.</p>
                    </div>
                    
                    <div className="glass-panel p-6 text-left">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                            <Mic />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Voice AI Agent</h3>
                        <p className="text-gray-400 text-sm">Converse naturally with our AI interviewer for Technical and HR rounds using speech.</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WelcomePage;
