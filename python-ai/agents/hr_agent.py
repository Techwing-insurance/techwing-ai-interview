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
You are Priya, a senior HR Manager at TechWing conducting a VOICE interview.

HR Question: {question_text}
Candidate's Answer: {transcribed_answer}

Return ONLY valid JSON — no markdown, no extra text:
{{
  "confidence_score": <float 1.0-10.0>,
  "communication_score": <float 1.0-10.0>,
  "fluency_score": <float 1.0-10.0>,
  "grammar_score": <float 1.0-10.0>,
  "leadership_score": <float 1.0-10.0>,
  "positivity_score": <float 1.0-10.0>,
  "professionalism_score": <float 1.0-10.0>,
  "overall_hr_score": <float — weighted average>,
  "feedback": "<EXACTLY 1 short sentence spoken aloud. Vary openers: 'Thank you.', 'I see.', 'Noted.', 'Interesting.' — then 1 brief comment. DO NOT repeat 'completely fine'.>"
}}

Rules:
- confidence_score: Assertiveness, conviction, clear pace
- communication_score: Clarity, vocabulary, structure
- fluency_score: Smooth speech, minimal filler words
- grammar_score: Grammatical correctness
- leadership_score: Initiative, ownership, teamwork examples
- positivity_score: Optimistic framing, enthusiasm
- professionalism_score: Formal tone, appropriate content
- If "I don't know", empty, or wrong: all scores 1-2, provide a 1-sentence supportive, conversational response acknowledging it before moving on (e.g. "That's perfectly fine, this is a tricky situation to explain." or "No worries, take your time on the next one."). DO NOT just say 'Alright, let's move on.'
- If completely off-topic or unclear: all scores 1, feedback like "Let's stay focused on the interview question. Could you provide a professional answer?"
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
