import os
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def get_resume_llm():
    """Returns the Groq LLM for heavy extraction tasks like Resume Parsing to avoid timeouts."""
    from langchain_groq import ChatGroq
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0.2,
        max_tokens=4096, 
        timeout=120
    )

def get_llm():
    """Returns the Groq LLM as the primary engine for real-time voice interviews to achieve <5s latency."""
    from langchain_groq import ChatGroq
    
    # Groq uses LPUs (Language Processing Units) which are significantly faster than GPUs,
    # ensuring the AI responds within 1-3 seconds for a real conversational feel.
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0.2,
        max_tokens=1024,
        timeout=15
    )
