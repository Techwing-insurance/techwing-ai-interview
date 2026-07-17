import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TechnicalRoundPage from './pages/TechnicalRoundPage';
import CodingRoundPage from './pages/CodingRoundPage';
import HrRoundPage from './pages/HrRoundPage';
import ReportPage from './pages/ReportPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" />;
    return children;
};

function App() {
    return (
        <div className="min-h-screen bg-techwing-dark text-white font-sans selection:bg-techwing-gold/30">
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/interview/technical" element={<ProtectedRoute><TechnicalRoundPage /></ProtectedRoute>} />
                <Route path="/interview/coding" element={<ProtectedRoute><CodingRoundPage /></ProtectedRoute>} />
                <Route path="/interview/hr" element={<ProtectedRoute><HrRoundPage /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            </Routes>
        </div>
    );
}

export default App;
