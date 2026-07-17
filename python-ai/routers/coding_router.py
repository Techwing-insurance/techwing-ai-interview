from fastapi import APIRouter, HTTPException
from models.schemas import CodingFeedbackRequest, CodingFeedbackResponse
from agents.coding_agent import get_coding_feedback

router = APIRouter(prefix="/ai/coding", tags=["Coding AI"])

@router.post("/feedback", response_model=CodingFeedbackResponse)
async def feedback(request: CodingFeedbackRequest):
    try:
        result = get_coding_feedback(
            code=request.code,
            language=request.language,
            problem_description=request.problem_description,
            passed_cases=request.passed_cases,
            total_cases=request.total_cases
        )
        return CodingFeedbackResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coding feedback failed: {str(e)}")
