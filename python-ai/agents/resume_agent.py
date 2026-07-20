"""
Resume Agent — extracts skills, projects, experience from PDF text using LLM.
"""
import json
import re
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

RESUME_PROMPT = ChatPromptTemplate.from_template("""
You are an elite, highly detailed resume parser. Your job is to extract EVERYTHING from the provided resume text.
Do NOT summarize. Do NOT omit any details. Do NOT use placeholders.

Resume Text:
{resume_text}

Return a valid JSON object with exactly this structure:
{{
  "skills": ["List EVERY SINGLE skill found in the resume, exhaustively"],
  "projects": [
    {{
      "name": "Full Project Name", 
      "description": "The COMPLETE, highly detailed description of the project exactly as described in the resume, including all bullet points and responsibilities. Do NOT summarize into a few words.", 
      "tech_stack": ["Every", "single", "technology", "used", "in", "this", "project"]
    }}
  ],
  "education": [
    {{"degree": "Full Degree Name", "institution": "Full Institution Name", "year": 2025}}
  ],
  "certifications": ["List every single certification found, exhaustively"],
  "experience_years": 0.5,
  "summary": "A highly detailed, comprehensive professional summary of the candidate's entire profile based on the resume (at least 3-4 sentences)."
}}

CRITICAL INSTRUCTIONS:
1. EXTRACT EXHAUSTIVELY: Do not leave out any skills, projects, or certifications.
2. FULL DESCRIPTIONS: For the project descriptions, copy the full detail and context from the resume. Do not compress them into a few words.
3. NO PLACEHOLDERS: Output only the actual data extracted from the resume text. 

Return ONLY valid JSON, no markdown formatting (like ```json) and no explanation.
""")

def analyze_resume(resume_text: str) -> dict:
    llm = get_llm()
    chain = RESUME_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({"resume_text": resume_text})
    # Clean markdown code blocks if present
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
