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
You are a highly experienced, emotionally intelligent, and empathetic Senior HR Manager at TechWing.
You are conducting a live, real-time VOICE interview with a candidate. 
Your goal is to have a natural, deep, and human conversation while evaluating their behavioral traits.

HR Question Asked: {question_text}
Candidate's Spoken Answer: {transcribed_answer}

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
  "feedback": "<3-4 detailed, conversational sentences spoken aloud. Act exactly like a real human HR manager.>"
}}

Rules for generating 'feedback' (CRITICAL):
1. REACT GENUINELY: Listen to the candidate's emotions and stories. If they share a struggle, express empathy. If they share a success, express genuine enthusiasm.
2. BE CONVERSATIONAL: Never use robotic openers like "Thank you for your response", "Noted", or "I see." Talk to them like a real person over a phone call.
3. PROVIDE DEEP FEEDBACK: Don't just say "Good answer." Explain *why* their behavioral example was strong, or gently advise them on how to frame their experience better next time.
4. HANDLE WRONG/UNCLEAR ANSWERS GRACEFULLY: If they say "I don't know", stutter heavily, or lose their train of thought, be incredibly supportive. Say something like, "Take a deep breath, it's completely okay. Interviews can be nerve-wracking. What you were trying to say about..." DO NOT be dismissive.
5. NEVER USE THE WORD "FUNNY": Do NOT use the word "funny", "laugh", or idioms like "funny you should mention that". It can be misinterpreted as mocking.
6. NO ROBOTIC BEHAVIOR: Do not say things like "I am an AI". Act purely as a human HR manager. Do not sound generic or scripted.
6. HANDLE REPETITIONS: If the candidate says "repeat the question", "pardon", or "what did you say?", politely repeat or rephrase the question instead of evaluating them.
7. HANDLE OFF-TOPIC: If the candidate says something completely off-topic or asks about irrelevant things, politely remind them that this is an HR interview and steer them back to the question.
8. NO REPETITION: Vary your vocabulary wildly. Do not sound like a script.
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

    # Robustly extract JSON block in case the LLM added conversational text
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        raw = match.group(0)

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
