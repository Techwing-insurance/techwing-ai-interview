"""
Text-To-Speech service using Edge TTS (free, high-quality neural voices).
"""
import edge_tts
import asyncio

async def text_to_speech_async(text: str, voice: str = "en-US-ChristopherNeural") -> bytes:
    """
    Converts text to speech audio (MP3 bytes) asynchronously.
    """
    communicate = edge_tts.Communicate(text, voice)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data

def text_to_speech(text: str, voice: str = "en-US-ChristopherNeural") -> bytes:
    """
    Synchronous wrapper for text_to_speech_async.
    """
    return asyncio.run(text_to_speech_async(text, voice))

async def text_to_speech_file_async(text: str, output_path: str, voice: str = "en-US-ChristopherNeural") -> str:
    audio_bytes = await text_to_speech_async(text, voice)
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    return output_path

def text_to_speech_file(text: str, output_path: str, voice: str = "en-US-ChristopherNeural") -> str:
    return asyncio.run(text_to_speech_file_async(text, output_path, voice))
