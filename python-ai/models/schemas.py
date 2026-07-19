from pydantic import BaseModel
from typing import Optional, List

# ── Resume ───────────────────────────────────────────────────────────────────
class ResumeAnalyzeRequest(BaseModel):
    resume_url: str
    user_id: int
    candidate_name: str

class ResumeAnalyzeResponse(BaseModel):
    skills: List[str]
    projects: List[dict]
    education: List[dict]
    certifications: List[str]
    experience_years: float
    summary: str

# ── Technical ─────────────────────────────────────────────────────────────────
class QuestionGenerateRequest(BaseModel):
    role_name: str
    resume_skills: List[str]
    count: int = 10

class GeneratedQuestion(BaseModel):
    question_text: str
    expected_answer: str
    difficulty: str
    category: str

class QuestionGenerateResponse(BaseModel):
    questions: List[GeneratedQuestion]

class TechnicalEvalRequest(BaseModel):
    question_text: str
    expected_answer: str
    transcribed_answer: str
    technology: str

class TechnicalEvalResponse(BaseModel):
    score: float
    accuracy_score: float
    depth_score: float
    communication_score: float
    feedback: str

# ── HR ────────────────────────────────────────────────────────────────────────
class HREvalRequest(BaseModel):
    question_text: str
    transcribed_answer: str

class HREvalResponse(BaseModel):
    confidence_score: float
    communication_score: float
    fluency_score: float
    grammar_score: float
    leadership_score: float
    positivity_score: float
    professionalism_score: float
    overall_hr_score: float
    feedback: str


# ── Report ────────────────────────────────────────────────────────────────────
class ReportGenerateRequest(BaseModel):
    session_id: int
    candidate_name: str
    track_name: str
    technical_score: float
    hr_score: float
    overall_score: float
    technical_answers: List[dict]
    hr_answers: List[dict]
    resume_skills: List[str]
    resume_summary: str

class ReportGenerateResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    technical_breakdown: dict
    hr_breakdown: dict
    ai_summary: str
    recommendation: str
    roadmap: dict

# ── STT ───────────────────────────────────────────────────────────────────────
class STTResponse(BaseModel):
    transcript: str
    confidence: float

# ── TTS ───────────────────────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    # Default: professional female interviewer voice
    # Options: "female" (Ava - warm), "male" (Andrew - authoritative),
    #          "female_uk" (Sonia - British), "male_uk" (Ryan - British)
    voice: Optional[str] = "female"
