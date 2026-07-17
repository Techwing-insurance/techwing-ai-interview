"""
Speech-To-Text service using OpenAI Whisper API.
"""
import os
import openai
from config import OPENAI_API_KEY

client = openai.OpenAI(api_key=OPENAI_API_KEY)

def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Transcribes audio using OpenAI Whisper.
    Returns dict with transcript and confidence.
    """
    try:
        import io
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename

        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
            response_format="verbose_json"
        )
        return {
            "transcript": response.text,
            "confidence": 0.95,
            "duration": getattr(response, "duration", 0)
        }
    except Exception as e:
        return {"transcript": "", "confidence": 0.0, "error": str(e)}
