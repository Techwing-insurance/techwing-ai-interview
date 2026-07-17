from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import TechnicalEvalRequest, TechnicalEvalResponse, STTResponse, QuestionGenerateRequest, QuestionGenerateResponse
from agents.technical_agent import evaluate_answer, generate_technical_questions
from services.stt_service import transcribe_audio

router = APIRouter(prefix="/ai/technical", tags=["Technical AI"])

@router.post("/generate-questions", response_model=QuestionGenerateResponse)
async def generate_questions(request: QuestionGenerateRequest):
    try:
        questions = generate_technical_questions(
            role_name=request.role_name,
            resume_skills=request.resume_skills,
            count=request.count
        )
        return QuestionGenerateResponse(questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/evaluate", response_model=TechnicalEvalResponse)
async def evaluate(request: TechnicalEvalRequest):
    try:
        result = evaluate_answer(
            question_text=request.question_text,
            expected_answer=request.expected_answer,
            transcribed_answer=request.transcribed_answer,
            technology=request.technology
        )
        return TechnicalEvalResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

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
