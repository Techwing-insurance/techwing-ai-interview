import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error in component:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-techwing-dark flex items-center justify-center p-6">
                    <div className="glass-panel p-12 text-center max-w-md w-full border border-red-500/30">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
                        <p className="text-gray-300 mb-8 text-sm">
                            We're sorry, but an unexpected error occurred. This could be due to a temporary network issue or high server load.
                        </p>
                        <button 
                            onClick={() => window.location.href = '/dashboard'} 
                            className="btn-primary w-full flex justify-center items-center py-3 gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Return to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
