import { useState, useRef } from 'react';

export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone', error);
            alert('Please allow microphone access to answer questions.');
        }
    };

    const stopRecording = () => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current) return resolve(null);

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setIsRecording(false);
                
                // Stop all tracks
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                
                resolve(blob);
            };

            mediaRecorderRef.current.stop();
        });
    };

    return { isRecording, startRecording, stopRecording };
};
