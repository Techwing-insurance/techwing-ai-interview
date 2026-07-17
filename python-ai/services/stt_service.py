"""
Speech-To-Text service using Groq Whisper API.
"""
import os
import io
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Transcribes audio using Groq Whisper.
    Returns dict with transcript and confidence.
    """
    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename

        # Groq's whisper-large-v3-turbo is incredibly fast and free
        response = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=(filename, audio_file.read()),
            language="en",
            response_format="verbose_json"
        )
        
        # Groq SDK returns an object, we can access .text
        return {
            "transcript": response.text,
            "confidence": 0.95,
            "duration": getattr(response, "duration", 0)
        }
    except Exception as e:
        return {"transcript": "", "confidence": 0.0, "error": str(e)}
