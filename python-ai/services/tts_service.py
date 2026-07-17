"""
Text-To-Speech service using OpenAI TTS API.
"""
import openai
from config import OPENAI_API_KEY

client = openai.OpenAI(api_key=OPENAI_API_KEY)

def text_to_speech(text: str, voice: str = "nova") -> bytes:
    """
    Converts text to speech audio (MP3 bytes).
    Available voices: alloy, echo, fable, onyx, nova, shimmer
    """
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text
    )
    return response.content

def text_to_speech_file(text: str, output_path: str, voice: str = "nova") -> str:
    audio_bytes = text_to_speech(text, voice)
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    return output_path
