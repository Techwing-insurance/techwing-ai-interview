import api from './api';

export const startCodingRound = () => api.post('/coding/start');
export const getProblem = (id) => api.get(`/coding/problem/${id}`);
export const runCode = (data) => api.post('/coding/run', data);
export const submitCode = (data) => api.post('/coding/submit', data);
export const completeCodingRound = (sessionId) => api.post(`/coding/complete?sessionId=${sessionId}`);
