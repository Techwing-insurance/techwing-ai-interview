"""
Text-To-Speech service using Microsoft Edge TTS (free, high-quality neural voices).
No API key required — uses Microsoft's neural voice infrastructure.

Available interviewer voices:
  female      → en-US-AvaNeural        (warm, professional American female) ✅ DEFAULT
  female_uk   → en-GB-SoniaNeural      (sophisticated British female)
  male        → en-US-AndrewNeural     (authoritative, friendly American male)
  male_uk     → en-GB-RyanNeural       (calm, professional British male)
  female2     → en-US-JennyNeural      (clear, energetic American female)
"""
import edge_tts
import asyncio
import io

# ─── VOICE MAP ────────────────────────────────────────────────────────────────
VOICE_MAP = {
    "female":     "en-US-AvaNeural",        # Warm professional female (default)
    "female_uk":  "en-GB-SoniaNeural",      # Sophisticated British female
    "female2":    "en-US-JennyNeural",      # Clear energetic female
    "male":       "en-US-AndrewNeural",     # Authoritative friendly male
    "male_uk":    "en-GB-RyanNeural",       # Calm professional British male
}

DEFAULT_VOICE = "en-US-AvaNeural"
DEFAULT_RATE  = "+0%"    # Normal speaking rate
DEFAULT_PITCH = "+0Hz"   # Normal pitch


async def text_to_speech_async(text: str, voice: str = "female") -> bytes:
    """
    Convert text to speech and return MP3 audio bytes.
    Uses Microsoft Edge TTS neural voices — no API key needed.
    """
    voice_name = VOICE_MAP.get(voice, DEFAULT_VOICE)

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice_name,
        rate=DEFAULT_RATE,
        pitch=DEFAULT_PITCH
    )

    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]

    return audio_data


def text_to_speech(text: str, voice: str = "female") -> bytes:
    """Synchronous wrapper — returns MP3 bytes."""
    return asyncio.run(text_to_speech_async(text, voice))


async def text_to_speech_file_async(text: str, output_path: str, voice: str = "female") -> str:
    """Save TTS output directly to a file."""
    audio_bytes = await text_to_speech_async(text, voice)
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    return output_path


def text_to_speech_file(text: str, output_path: str, voice: str = "female") -> str:
    """Synchronous file-saving wrapper."""
    return asyncio.run(text_to_speech_file_async(text, output_path, voice))

