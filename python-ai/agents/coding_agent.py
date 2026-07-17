"""
Coding Feedback Agent — analyzes code quality and provides optimization suggestions.
"""
import json
import re
from config import get_llm
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

CODING_PROMPT = ChatPromptTemplate.from_template("""
You are a senior software engineer reviewing a coding solution.

Problem: {problem_description}
Language: {language}
Test Cases Passed: {passed_cases} / {total_cases}

Submitted Code:
```{language}
{code}
```

Provide feedback and return valid JSON:
{{
  "feedback": "<detailed 2-4 sentence feedback>",
  "time_complexity": "<e.g., O(n), O(n log n), O(n^2)>",
  "space_complexity": "<e.g., O(1), O(n)>",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Be constructive. Mention:
1. Whether the approach is correct
2. Time and space complexity
3. How to improve it if suboptimal

Return ONLY JSON, no markdown.
""")

def get_coding_feedback(code: str, language: str, problem_description: str,
                        passed_cases: int, total_cases: int) -> dict:
    llm = get_llm()
    chain = CODING_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "code": code,
        "language": language,
        "problem_description": problem_description,
        "passed_cases": passed_cases,
        "total_cases": total_cases
    })
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
