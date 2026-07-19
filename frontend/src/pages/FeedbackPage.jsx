import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { submitFeedback } from '../services/interviewService';
import { useInterview } from '../context/InterviewContext';
import Swal from 'sweetalert2';

const FeedbackPage = () => {
    const navigate = useNavigate();
    const { sessionId } = useInterview();
    
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!sessionId) {
            Swal.fire({
                title: 'Error',
                text: 'No active session found. Please return to the dashboard.',
                icon: 'error',
                background: '#1a1f2b',
                color: '#fff'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await submitFeedback({
                sessionId,
                rating,
                feedbackText
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            Swal.fire({
                title: 'Error',
                text: 'Could not submit feedback. Please try again.',
                icon: 'error',
                background: '#1a1f2b',
                color: '#fff'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-techwing-dark flex items-center justify-center p-6">
            <div className="glass-panel p-10 max-w-lg w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-techwing-gold to-orange-500"></div>
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-techwing-gold/10 border border-techwing-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-techwing-gold" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">How was your experience?</h2>
                    <p className="text-gray-400">Your feedback helps us improve the AI interviewer.</p>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Rating */}
                        <div className="flex flex-col items-center">
                            <label className="text-sm font-medium text-gray-300 mb-3">Overall Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(rating)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${
                                                star <= (hover || rating) 
                                                    ? 'fill-techwing-gold text-techwing-gold drop-shadow-[0_0_8px_rgba(202,169,40,0.5)]' 
                                                    : 'text-gray-600'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Any detailed feedback? (Optional)</label>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-techwing-gold transition-colors resize-none"
                                placeholder="Tell us what you liked or what could be better..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                            ) : (
                                'Submit Feedback'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8 animate-fade-in">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
                        <p className="text-gray-400 mb-8">Your feedback has been recorded successfully.</p>
                        
                        <button
                            onClick={() => navigate('/report')}
                            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                        >
                            Check your report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackPage;
