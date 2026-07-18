import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceAvatar = ({ isListening, isSpeaking, isProcessing, volume = 0, onStartListening, onStopListening }) => {
    // Calculate scale based on volume (similar to ChatGPT voice orb)
    const scale = isListening ? 1 + (volume / 160) * 0.35 : 1;

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="relative mb-8">
                {/* Outer pulsing glow when listening or speaking */}
                {(isListening || isSpeaking) && (
                    <div className={`absolute inset-0 rounded-full animate-pulse-glow ${isListening ? 'bg-techwing-orange/20' : 'bg-techwing-gold/20'}`}></div>
                )}
                
                {/* Avatar Image container */}
                <div 
                    style={{ transform: `scale(${scale})`, transition: 'transform 0.05s ease-out' }}
                    className={`relative w-48 h-48 rounded-full overflow-hidden border-4 z-10 
                    ${isListening ? 'border-techwing-orange' : isSpeaking ? 'border-techwing-gold' : 'border-white/10'}`}>
                    
                    <img 
                        src="/src/assets/avatar.jpeg" 
                        alt="AI Interviewer" 
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                            e.target.onerror = null;
                            // Fallback: hide image and show initials
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent && !parent.querySelector('.avatar-fallback')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'avatar-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-techwing-gold text-4xl font-bold';
                                fallback.textContent = 'AI';
                                parent.appendChild(fallback);
                            }
                        }} 
                    />
                    
                    {/* Overlay overlay when processing */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="w-12 h-12 text-techwing-gold animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {!isListening ? (
                    <button 
                        onClick={onStartListening}
                        disabled={isProcessing || isSpeaking}
                        className="btn-primary rounded-full w-16 h-16 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Start Speaking"
                    >
                        <Mic className="w-6 h-6" />
                    </button>
                ) : (
                    <button 
                        onClick={onStopListening}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                        title="Stop Speaking"
                    >
                        <MicOff className="w-6 h-6" />
                    </button>
                )}
            </div>
            
            <p className="mt-4 text-sm font-medium h-6 text-gray-300">
                {isListening ? "Listening..." : isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : "Tap mic to speak"}
            </p>
        </div>
    );
};

export default VoiceAvatar;
