import React from 'react';

const TechWingLoader = ({ text = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 p-8 min-h-[50vh]">
            <div className="relative w-24 h-24">
                {/* Outer glowing ring */}
                <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-techwing-gold animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(255,184,0,0.4)]"></div>
                
                {/* Inner counter-rotating ring */}
                <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-techwing-orange animate-[spin_1.5s_linear_infinite_reverse] shadow-[0_0_15px_rgba(255,107,0,0.4)]"></div>
                
                {/* Center pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-tr from-techwing-gold to-techwing-orange rounded-full animate-pulse shadow-[0_0_20px_rgba(255,184,0,0.6)]"></div>
                </div>
            </div>
            
            {/* Loading text with animated ellipsis */}
            <div className="flex items-center text-techwing-gold font-medium tracking-widest uppercase text-sm">
                {text.replace('...', '')}
                <span className="inline-flex w-4 overflow-hidden">
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out] origin-bottom delay-0">.</span>
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out] origin-bottom delay-150">.</span>
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out] origin-bottom delay-300">.</span>
                </span>
            </div>
        </div>
    );
};

export default TechWingLoader;
