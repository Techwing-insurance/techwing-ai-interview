"""
Technical Interview Agent — evaluates student answers for accuracy, depth, communication.
"""
import json
import re
from config import get_llm
from langchain.prompts import ChatPromptTemplate
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
