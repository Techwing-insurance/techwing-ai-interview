import axios from 'axios';

// Use VITE_API_BASE_URL if available (for Render), otherwise fallback to relative /api for local dev proxy
const api = axios.create({
    baseURL: '/api', // Use relative path since frontend is statically served by Spring Boot
    timeout: 120000, // 120 second timeout for AI operations
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Auto-logout on 401 Unauthorized (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip interceptor for authentication endpoints
        const isAuthEndpoint = error.config && error.config.url && (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register'));
        
        if (error.response && error.response.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
