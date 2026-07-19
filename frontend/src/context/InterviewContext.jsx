import React, { createContext, useContext, useState, useEffect } from 'react';

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
    // Persist sessionId in localStorage so the Report page survives navigation
    const [sessionId, setSessionIdState] = useState(() => {
        const stored = localStorage.getItem('interviewSessionId');
        return stored ? parseInt(stored) : null;
    });
    const [currentRound, setCurrentRound] = useState(null);

    const setSessionId = (id) => {
        if (id) {
            localStorage.setItem('interviewSessionId', id);
        } else {
            localStorage.removeItem('interviewSessionId');
        }
        setSessionIdState(id);
    };

    return (
        <InterviewContext.Provider value={{ sessionId, setSessionId, currentRound, setCurrentRound }}>
            {children}
        </InterviewContext.Provider>
    );
};

export const useInterview = () => useContext(InterviewContext);
