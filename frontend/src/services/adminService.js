import api from './api';

export const getTracks = () => api.get('/admin/tracks');
export const getTrack = (id) => api.get(`/admin/tracks/${id}`);
export const addTrack = (data) => api.post('/admin/tracks', data);
export const deleteTrack = (id) => api.delete(`/admin/tracks/${id}`);
export const getStudents = () => api.get('/admin/students');
export const getAllStudentsPerformance = () => api.get('/admin/students/performance');
export const getTrackStudentsPerformance = (trackId) => api.get(`/admin/tracks/${trackId}/students/performance`);
export const getStudentSessions = (userId) => api.get(`/admin/students/${userId}/sessions`);
export const toggleUserStatus = (id, active) => api.put(`/admin/users/${id}/activate?active=${active}`);
export const getTrackConfig = (id) => api.get(`/admin/tracks/${id}/config`);
export const updateTrackConfig = (id, data) => api.put(`/admin/tracks/${id}/config`, data);
