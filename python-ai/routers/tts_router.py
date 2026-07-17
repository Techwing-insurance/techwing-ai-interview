from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import TTSRequest
from services.tts_service import text_to_speech

router = APIRouter(prefix="/ai/tts", tags=["TTS"])

@router.post("/generate")
async def generate_speech(request: TTSRequest):
    try:
        audio_bytes = text_to_speech(request.text, request.voice)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")
