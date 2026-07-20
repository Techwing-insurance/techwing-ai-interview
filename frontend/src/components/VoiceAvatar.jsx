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
                    style={isListening ? { transform: `scale(${scale})`, transition: 'transform 0.05s ease-out' } : undefined}
                    className={`relative w-48 h-48 rounded-full overflow-hidden border-4 z-10 
                    ${isListening ? 'border-techwing-orange' : isSpeaking ? 'border-techwing-gold animate-speaking-pulse' : 'border-white/10'}`}>
                    
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
        </div>
    );
};

export default VoiceAvatar;
