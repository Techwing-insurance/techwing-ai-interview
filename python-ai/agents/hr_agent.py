"""
HR Interview Agent — evaluates HR responses on 7 dimensions.
"""
import json
import re
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

HR_EVAL_PROMPT = ChatPromptTemplate.from_template("""
You are an experienced HR interviewer evaluating a fresher candidate's response.

HR Question: {question_text}

Candidate's Answer: {transcribed_answer}

Evaluate on these 7 dimensions (each scored 0-10) and return valid JSON:
{{
  "confidence_score": <float>,
  "communication_score": <float>,
  "fluency_score": <float>,
  "grammar_score": <float>,
  "leadership_score": <float>,
  "positivity_score": <float>,
  "professionalism_score": <float>,
  "overall_hr_score": <float average of all 7>,
  "feedback": "<2-3 sentence constructive feedback>"
}}

Scoring guide for each dimension:
- confidence_score: Assertiveness, clear conviction, good speaking pace
- communication_score: Clarity, vocabulary, sentence structure  
- fluency_score: Smooth speech, minimal filler words (um, uh, like)
- grammar_score: Grammatical correctness in English
- leadership_score: Examples of taking initiative, leading a team
- positivity_score: Optimistic framing, enthusiasm for the role
- professionalism_score: Formal tone, appropriate content, maturity

Return ONLY JSON, no markdown.
""")

def evaluate_hr_answer(question_text: str, transcribed_answer: str) -> dict:
    llm = get_llm()
    chain = HR_EVAL_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "question_text": question_text,
        "transcribed_answer": transcribed_answer
    })
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
