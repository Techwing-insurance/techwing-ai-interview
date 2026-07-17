import api from './api';

export const getTracks = () => api.get('/admin/tracks');
export const addTrack = (data) => api.post('/admin/tracks', data);
export const deleteTrack = (id) => api.delete(`/admin/tracks/${id}`);
export const getStudents = () => api.get('/admin/students');
export const getStudentSessions = (userId) => api.get(`/admin/students/${userId}/sessions`);
export const toggleUserStatus = (id, active) => api.put(`/admin/users/${id}/activate?active=${active}`);
