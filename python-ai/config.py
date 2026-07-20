import os
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")

def get_llm():
    from langchain_nvidia_ai_endpoints import ChatNVIDIA
    return ChatNVIDIA(
        model="meta/llama-3.3-70b-instruct", 
        api_key=NVIDIA_API_KEY, 
        temperature=0.2,
        top_p=0.7,
        max_tokens=1024
    )
