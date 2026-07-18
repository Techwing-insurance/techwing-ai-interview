import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-techwing-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-techwing-gold/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 glass-panel p-12 max-w-lg w-full">
                <div className="w-20 h-20 bg-techwing-orange/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-techwing-orange/20">
                    <AlertTriangle className="w-10 h-10 text-techwing-orange" />
                </div>
                
                <h1 className="text-6xl font-bold text-white mb-2">404</h1>
                <h2 className="text-2xl font-bold text-techwing-gold mb-4">Page Not Found</h2>
                <p className="text-gray-400 mb-8 text-lg">
                    Oops! It seems you've wandered into an uncharted territory. The page you are looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
