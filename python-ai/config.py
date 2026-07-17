import os
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER   = os.getenv("LLM_PROVIDER", "groq")
LLM_MODEL      = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")

def get_llm():
    if LLM_PROVIDER == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=LLM_MODEL, api_key=OPENAI_API_KEY, temperature=0.3)
    elif LLM_PROVIDER == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(model=LLM_MODEL, groq_api_key=GROQ_API_KEY, temperature=0.3)
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=GOOGLE_API_KEY, temperature=0.3)
