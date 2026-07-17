import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVAD - Voice Activity Detection Hook
 * Uses Web Audio API to detect speaking and silence to auto-record and stop.
 */
export const useVAD = ({
  silenceThreshold = 7,
  silenceDurationMs = 1400,
  minRecordingMs = 1000,
  onSpeechEnd,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        if (onSpeechEnd) {
          onSpeechEnd(audioBlob);
        }
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);

      const checkSilenceLoop = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const currentVolume = sum / dataArray.length;
        setVolume(currentVolume);

        const now = Date.now();
        const recordingDuration = now - recordingStartTimeRef.current;

        if (currentVolume > silenceThreshold) {
          // User is speaking, reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          // User is silent
          if (!silenceTimerRef.current && recordingDuration > minRecordingMs) {
            silenceTimerRef.current = setTimeout(() => {
              stopRecording();
            }, silenceDurationMs);
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkSilenceLoop);
      };

      checkSilenceLoop();

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, [silenceThreshold, silenceDurationMs, minRecordingMs, onSpeechEnd, stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return { startRecording, stopRecording, isRecording, volume };
};
