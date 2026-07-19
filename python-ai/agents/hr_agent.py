"""
HR Interview Agent — evaluates HR responses on 7 dimensions.
Behaves like a real HR interviewer.
"""
import json
import re
from config import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

HR_EVAL_PROMPT = ChatPromptTemplate.from_template("""
You are Priya, a senior HR Manager at TechWing conducting a professional voice HR interview.

HR Question asked: {question_text}

Candidate's Answer: {transcribed_answer}

Evaluate the candidate's response on these 7 dimensions (each scored 1.0–10.0) and return ONLY valid JSON:
{{
  "confidence_score": <float>,
  "communication_score": <float>,
  "fluency_score": <float>,
  "grammar_score": <float>,
  "leadership_score": <float>,
  "positivity_score": <float>,
  "professionalism_score": <float>,
  "overall_hr_score": <float — weighted average of all 7>,
  "feedback": "<1-2 sentences of spoken feedback. This WILL be spoken aloud.>"
}}

Scoring guide:
- confidence_score: Assertiveness, conviction, clear speaking pace
- communication_score: Clarity, vocabulary, sentence structure
- fluency_score: Smooth speech, minimal filler words (um, uh, like)
- grammar_score: Grammatical correctness in English
- leadership_score: Examples of initiative, ownership, team leadership
- positivity_score: Optimistic framing, enthusiasm for the role
- professionalism_score: Formal tone, appropriate content, maturity

CRITICAL INTERVIEWER BEHAVIOR RULES:
1. If candidate says "I don't know", "I'm not sure", "I have no idea", or gives an empty answer:
   Score all dimensions 1.0. Feedback: "That's okay, let's move on to the next question."
2. If candidate asks a personal question ("How are you?", "What's your name?") or goes off-topic:
   Score all dimensions 1.0. Feedback: "Let's stay focused on the interview. Let's move to the next question."
3. Otherwise: Be constructive and encouraging. Start feedback with "Thank you..." or "Good answer..." or "That was insightful...".
4. Keep feedback SHORT — 1-2 sentences max. It will be SPOKEN aloud by text-to-speech.

Return ONLY valid JSON, no markdown, no extra text.
""")

def evaluate_hr_answer(question_text: str, transcribed_answer: str) -> dict:
    """
    Evaluate a candidate's HR answer on 7 professional dimensions.
    The 'feedback' field is spoken aloud by the TTS engine.
    """
    llm = get_llm()
    chain = HR_EVAL_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "question_text": question_text,
        "transcribed_answer": transcribed_answer
    })
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        result = json.loads(raw)
        return {
            "confidence_score": float(result.get("confidence_score", 5.0)),
            "communication_score": float(result.get("communication_score", 5.0)),
            "fluency_score": float(result.get("fluency_score", 5.0)),
            "grammar_score": float(result.get("grammar_score", 5.0)),
            "leadership_score": float(result.get("leadership_score", 5.0)),
            "positivity_score": float(result.get("positivity_score", 5.0)),
            "professionalism_score": float(result.get("professionalism_score", 5.0)),
            "overall_hr_score": float(result.get("overall_hr_score", 5.0)),
            "feedback": result.get("feedback", "Thank you for your response. Let's continue.")
        }
    except Exception:
        return {
            "confidence_score": 5.0, "communication_score": 5.0, "fluency_score": 5.0,
            "grammar_score": 5.0, "leadership_score": 5.0, "positivity_score": 5.0,
            "professionalism_score": 5.0, "overall_hr_score": 5.0,
            "feedback": "Thank you for your answer. Let's move to the next question."
        }
