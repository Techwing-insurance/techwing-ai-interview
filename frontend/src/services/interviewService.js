import api from './api';

export const uploadResume = (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const getResumeStatus = () => api.get('/resume/status');

// Voice / AI Services
export const transcribeVoice = (formData, roundType) => api.post(`/voice/transcribe?roundType=${roundType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Technical Round
export const startTechnicalRound = () => api.post('/interview/technical/start');
export const answerTechnicalQuestion = (data) => api.post('/interview/technical/answer', data);
export const getNextTechnicalQuestion = (sessionId) => api.get(`/interview/technical/next?sessionId=${sessionId}`);
export const completeTechnicalRound = (sessionId) => api.post(`/interview/technical/complete?sessionId=${sessionId}`);

// HR Round
export const startHrRound = () => api.post('/interview/hr/start');
export const answerHrQuestion = (data) => api.post('/interview/hr/answer', data);
export const getNextHrQuestion = (sessionId) => api.get(`/interview/hr/next?sessionId=${sessionId}`);
export const completeHrRound = (sessionId) => api.post(`/interview/hr/complete?sessionId=${sessionId}`);

// Reports
export const generateReport = (sessionId) => api.post(`/report/generate/${sessionId}`);
export const getReport = (sessionId) => api.get(`/report/${sessionId}`);

// Feedback
export const submitFeedback = (data) => api.post('/interview/feedback', data);
