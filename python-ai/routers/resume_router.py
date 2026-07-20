from fastapi import APIRouter, HTTPException
from models.schemas import ResumeAnalyzeRequest, ResumeAnalyzeResponse
from agents.resume_agent import analyze_resume
from services.pdf_service import extract_text_from_pdf_url

router = APIRouter(prefix="/ai/resume", tags=["Resume AI"])

@router.post("/analyze", response_model=ResumeAnalyzeResponse)
def analyze(request: ResumeAnalyzeRequest):
    try:
        resume_text = extract_text_from_pdf_url(request.resume_url)
        if not resume_text or len(resume_text) < 50:
            raise HTTPException(status_code=400, detail="Could not extract text from resume PDF")
        result = analyze_resume(resume_text)
        return ResumeAnalyzeResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")
