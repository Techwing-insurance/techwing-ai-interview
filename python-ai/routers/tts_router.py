"""
TTS Router — Text-to-Speech endpoints for the interview voice agent.

Endpoints:
  POST /ai/tts/speak       → Used by React frontend to speak questions/feedback
  POST /ai/tts/generate    → Legacy endpoint (kept for compatibility)
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import TTSRequest
from services.tts_service import text_to_speech_async
import asyncio

router = APIRouter(prefix="/ai/tts", tags=["TTS"])


@router.post("/speak")
async def speak(request: TTSRequest):
    """
    Convert text to MP3 audio and return it.
    Called by the React frontend to have the AI interviewer speak.
    
    Voice options (pass in request body):
      "female"    → Ava (warm American female) — DEFAULT
      "male"      → Andrew (authoritative American male)
      "female_uk" → Sonia (sophisticated British female)
      "male_uk"   → Ryan (calm British male)
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        audio_bytes = await text_to_speech_async(request.text, request.voice or "female")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/generate")
async def generate_speech(request: TTSRequest):
    """Legacy endpoint — same as /speak, kept for backward compatibility."""
    return await speak(request)


@router.get("/voices")
async def list_voices():
    """Returns available voice options for the frontend."""
    return {
        "voices": [
            {"key": "female",    "name": "Ava (American Female)",    "accent": "American", "default": True},
            {"key": "male",      "name": "Andrew (American Male)",   "accent": "American", "default": False},
            {"key": "female_uk", "name": "Sonia (British Female)",   "accent": "British",  "default": False},
            {"key": "male_uk",   "name": "Ryan (British Male)",      "accent": "British",  "default": False},
            {"key": "female2",   "name": "Jenny (American Female)",  "accent": "American", "default": False},
        ]
    }

