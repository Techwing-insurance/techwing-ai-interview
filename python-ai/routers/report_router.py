from fastapi import APIRouter, HTTPException
from models.schemas import ReportGenerateRequest, ReportGenerateResponse
from agents.report_agent import generate_report

router = APIRouter(prefix="/ai/report", tags=["Report AI"])

@router.post("/generate", response_model=ReportGenerateResponse)
async def generate(request: ReportGenerateRequest):
    try:
        result = generate_report(request.model_dump())
        return ReportGenerateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
