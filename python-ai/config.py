import os
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")

def get_llm():
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model="meta/llama-3.3-70b-instruct", 
        api_key=NVIDIA_API_KEY, 
        base_url="https://integrate.api.nvidia.com/v1",
        temperature=0.2,
        max_tokens=1024
    )
