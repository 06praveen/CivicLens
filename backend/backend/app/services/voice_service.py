"""
CivicLens Voice Transcription Service

Handles audio payload validation, base64 encoding, and multi-modal transcription via Gemini API.
Strictly returns the actual transcribed text from audio or an empty string with error status.
NEVER returns hardcoded fallback question strings.
"""

import os
import base64
import httpx
from typing import Dict, Any, Optional
from app.config import settings


class VoiceService:

    @staticmethod
    def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm", language: str = "en-IN") -> Dict[str, Any]:
        """
        Transcribe audio bytes using Gemini Multimodal Audio API.
        Returns dictionary with exact transcript string or error status.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            return {
                "transcript": "",
                "error": "Audio recording was empty or unreadable",
                "provider": "validation_failed",
                "language": language
            }

        api_key = settings.GEMINI_API_KEY or os.environ.get("SPEECH_TO_TEXT_API_KEY")
        if not api_key:
            return {
                "transcript": "",
                "error": "Backend transcription API key is not configured",
                "provider": "no_api_key",
                "language": language
            }

        # Normalize mime type
        mime = content_type or "audio/webm"
        if ";" in mime:
            mime = mime.split(";")[0].strip()

        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")

        prompt_text = (
            f"You are an exact speech-to-text transcription engine for public domain audio. "
            f"Listen to the spoken audio and transcribe what the user said into plain text accurately. "
            f"Return ONLY the plain transcribed text. Do not add intro, markdown formatting, commentary, or explanations. "
            f"If the speech is in Hindi, transcribe in Hindi/Devanagari script or Romanized Hindi as spoken. "
            f"Language hint: {language}."
        )

        models_to_try = [
            getattr(settings, "GEMINI_MODEL", "gemini-flash-latest") or "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ]

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [
                        {"inlineData": {"mimeType": mime, "data": b64_audio}},
                        {"text": prompt_text}
                    ]
                }]
            }

            try:
                resp = httpx.post(url, json=payload, timeout=12.0)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            # Clean surrounding quotes and trailing newlines
                            cleaned = raw_text.strip('"').strip("'").strip("`").strip()
                            if cleaned:
                                print(f"TRANSCRIPTION SUCCESS [{model}]: '{cleaned}'")
                                return {
                                    "transcript": cleaned,
                                    "provider": f"gemini_{model}",
                                    "language": language
                                }
                else:
                    print(f"Gemini Audio Transcription HTTP {resp.status_code} [{model}]:", resp.text[:150])
            except Exception as e:
                print(f"Voice transcription exception [{model}]:", e)
                continue

        # If transcription failed or returned no text
        return {
            "transcript": "",
            "error": "Speech could not be transcribed from recorded audio. Please try speaking again or type your question.",
            "provider": "failed",
            "language": language
        }
