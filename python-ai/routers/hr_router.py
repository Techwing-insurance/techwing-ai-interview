from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import HREvalRequest, HREvalResponse, STTResponse
from agents.hr_agent import evaluate_hr_answer
from services.stt_service import transcribe_audio

router = APIRouter(prefix="/ai/hr", tags=["HR AI"])

@router.post("/evaluate", response_model=HREvalResponse)
async def evaluate(request: HREvalRequest):
    try:
        result = evaluate_hr_answer(
            question_text=request.question_text,
            transcribed_answer=request.transcribed_answer
        )
        return HREvalResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HR evaluation failed: {str(e)}")

@router.post("/transcribe", response_model=STTResponse)
async def transcribe(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        result = transcribe_audio(audio_bytes, audio.filename)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return STTResponse(transcript=result["transcript"], confidence=result["confidence"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
