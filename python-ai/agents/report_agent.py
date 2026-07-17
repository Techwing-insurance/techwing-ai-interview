"""
Report Agent — generates final assessment report with strengths, weaknesses, roadmap.
"""
import json
import re
from config import get_llm
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

REPORT_PROMPT = ChatPromptTemplate.from_template("""
You are an AI hiring assessment expert. Generate a comprehensive final report.

Candidate: {candidate_name}
Track: {track_name}
Technical Score: {technical_score}/100
Coding Score: {coding_score}/100
HR Score: {hr_score}/100
Overall Score: {overall_score}/100

Resume Skills: {resume_skills}
Resume Summary: {resume_summary}

Technical Q&A Summary:
{technical_summary}

HR Answers Summary:
{hr_summary}

Coding Performance:
{coding_summary}

Generate a detailed report and return valid JSON:
{{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "technical_breakdown": {{
    "Core Concepts": <score 1-10>,
    "Problem Solving": <score 1-10>,
    "Communication": <score 1-10>
  }},
  "hr_breakdown": {{
    "Communication": <score 1-10>,
    "Confidence": <score 1-10>,
    "Professionalism": <score 1-10>
  }},
  "ai_summary": "<3-4 sentence comprehensive narrative about the candidate>",
  "recommendation": "<STRONGLY_RECOMMENDED | RECOMMENDED | BORDERLINE | NOT_RECOMMENDED>",
  "roadmap": {{
    "priority_topics": ["topic1", "topic2", "topic3"],
    "weeks": [
      {{"week": 1, "focus": "Topic", "topics": ["subtopic1", "subtopic2"]}},
      {{"week": 2, "focus": "Topic", "topics": ["subtopic1", "subtopic2"]}},
      {{"week": 3, "focus": "Topic", "topics": ["subtopic1", "subtopic2"]}},
      {{"week": 4, "focus": "Topic", "topics": ["subtopic1", "subtopic2"]}}
    ],
    "estimated_duration_weeks": 8
  }}
}}

Return ONLY JSON, no markdown.
""")

def generate_report(data: dict) -> dict:
    llm = get_llm()
    chain = REPORT_PROMPT | llm | StrOutputParser()
    
    tech_summary = "\n".join([
        f"Q: {a.get('question','')}\nA: {a.get('transcript','')}\nScore: {a.get('score',0)}/10"
        for a in data.get("technical_answers", [])[:5]
    ])
    hr_summary = "\n".join([
        f"Q: {a.get('question','')}\nA: {a.get('transcript','')}\nScore: {a.get('overall_hr_score',0)}/10"
        for a in data.get("hr_answers", [])[:5]
    ])
    coding_summary = "\n".join([
        f"Problem: {s.get('problem','')}\nPassed: {s.get('passed_cases',0)}/{s.get('total_cases',0)}"
        for s in data.get("coding_submissions", [])
    ])
    
    raw = chain.invoke({
        "candidate_name": data["candidate_name"],
        "track_name": data["track_name"],
        "technical_score": data["technical_score"],
        "coding_score": data["coding_score"],
        "hr_score": data["hr_score"],
        "overall_score": data["overall_score"],
        "resume_skills": ", ".join(data.get("resume_skills", [])),
        "resume_summary": data.get("resume_summary", ""),
        "technical_summary": tech_summary,
        "hr_summary": hr_summary,
        "coding_summary": coding_summary
    })
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
