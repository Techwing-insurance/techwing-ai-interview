import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE"))

models_to_test = [
    "llama3-8b-8192",
    "llama-3.3-70b-versatile",
    "llama-3.2-90b-vision-preview",
    "mixtral-8x7b-32768"
]

for model in models_to_test:
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=10
        )
        print(f"SUCCESS: {model}")
    except Exception as e:
        print(f"FAILED: {model} -> {e}")
