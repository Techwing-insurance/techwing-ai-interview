"""
Resume Agent — extracts skills, projects, experience from PDF text using LLM.
"""
import json
import re
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

RESUME_PROMPT = ChatPromptTemplate.from_template("""
You are an expert resume parser. Analyze the following resume text and extract structured information.

Resume Text:
{resume_text}

Return a valid JSON object with exactly this structure:
{{
  "skills": ["skill1", "skill2", ...],
  "projects": [
    {{"name": "...", "description": "...", "tech_stack": ["...", "..."]}}
  ],
  "education": [
    {{"degree": "...", "institution": "...", "year": 2025}}
  ],
  "certifications": ["cert1", "cert2"],
  "experience_years": 0.5,
  "summary": "Brief 2-3 sentence professional summary of the candidate"
}}

Return ONLY the JSON, no markdown, no explanation.
""")

def analyze_resume(resume_text: str) -> dict:
    llm = get_llm()
    chain = RESUME_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({"resume_text": resume_text})
    # Clean markdown code blocks if present
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
