import React, { createContext, useContext, useState } from 'react';

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [currentRound, setCurrentRound] = useState(null); // 'TECHNICAL', 'CODING', 'HR'

    return (
        <InterviewContext.Provider value={{ sessionId, setSessionId, currentRound, setCurrentRound }}>
            {children}
        </InterviewContext.Provider>
    );
};

export const useInterview = () => useContext(InterviewContext);
