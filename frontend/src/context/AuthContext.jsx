import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (data) => {
        const res = await authService.login(data);
        if (res.data && res.data.data) {
            const { accessToken, refreshToken, user } = res.data.data;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            setIsAuthenticated(true);
            navigate('/dashboard');
        }
    };

    const register = async (data) => {
        const res = await authService.register(data);
        if (res.data && res.data.data) {
            const { accessToken, refreshToken, user } = res.data.data;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            setIsAuthenticated(true);
            navigate('/dashboard');
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
