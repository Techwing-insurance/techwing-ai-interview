import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { InterviewProvider } from './context/InterviewContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <InterviewProvider>
          <App />
        </InterviewProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
