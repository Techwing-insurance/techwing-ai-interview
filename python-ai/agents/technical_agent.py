"""
Technical Interview Agent — evaluates student answers for accuracy, depth, communication.
"""
import json
import re
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

EVAL_PROMPT = ChatPromptTemplate.from_template("""
You are a senior software engineer conducting a technical interview for a {technology} role.

Question asked: {question_text}

Key points expected in a good answer:
{expected_answer}

Candidate's answer:
{transcribed_answer}

Evaluate the candidate's answer and return a valid JSON with:
{{
  "score": <float 0-10, overall score>,
  "accuracy_score": <float 0-10, factual correctness>,
  "depth_score": <float 0-10, depth of understanding>,
  "communication_score": <float 0-10, clarity and structure>,
  "feedback": "<2-3 sentence constructive feedback>"
}}

Scoring guide:
- 9-10: Excellent, complete, with real-world examples
- 7-8:  Good, mostly correct, minor gaps
- 5-6:  Partial, missing key concepts
- 3-4:  Vague, significant gaps
- 0-2:  Incorrect or no answer

Return ONLY JSON, no markdown.
""")

def evaluate_answer(question_text: str, expected_answer: str,
                    transcribed_answer: str, technology: str) -> dict:
    llm = get_llm()
    chain = EVAL_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "question_text": question_text,
        "expected_answer": expected_answer,
        "transcribed_answer": transcribed_answer,
        "technology": technology
    })
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)

GENERATE_PROMPT = ChatPromptTemplate.from_template("""
You are a Senior Technical Interviewer preparing to interview a candidate for a {role_name} role.
The candidate's resume lists the following technical skills: {resume_skills}

Generate exactly {count} technical interview questions. 
CRITICAL RULES FOR GENERATION:
1. Exactly HALF of the questions (e.g. 5 if count is 10) MUST strictly focus on the candidate's specific resume skills.
2. Exactly HALF of the questions MUST strictly focus on core and advanced concepts related to the {role_name} role (regardless of resume).
3. RANDOMIZATION: You MUST generate highly unique and uncommon questions. Do not generate the same standard boilerplate questions. Think outside the box and ensure this specific combination of questions is extremely rare and random.
4. The questions should test practical understanding and core concepts.

Return a valid JSON array of objects. Each object must have:
- "question_text": The interview question.
- "expected_answer": A comprehensive summary of what a perfect answer would include.
- "difficulty": "EASY", "MEDIUM", or "HARD".
- "category": "TECHNICAL"

Example output:
[
  {{
    "question_text": "How does React's Virtual DOM improve performance?",
    "expected_answer": "It minimizes direct DOM manipulation by keeping a lightweight copy of the DOM in memory, calculating the difference (diffing), and batch updating the real DOM.",
    "difficulty": "MEDIUM",
    "category": "TECHNICAL"
  }}
]

Return ONLY the JSON array, no markdown.
""")

def generate_technical_questions(role_name: str, resume_skills: list[str], count: int = 5) -> list[dict]:
    llm = get_llm()
    chain = GENERATE_PROMPT | llm | StrOutputParser()
    skills_str = ", ".join(resume_skills) if resume_skills else "General technical skills"
    raw = chain.invoke({
        "role_name": role_name,
        "resume_skills": skills_str,
        "count": count
    })
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
