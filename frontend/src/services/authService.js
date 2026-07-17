import api from "./api";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = (refreshToken) => api.post(`/auth/logout?refreshToken=${refreshToken}`);
export const refreshToken = (token) => api.post(`/auth/refresh?refreshToken=${token}`);