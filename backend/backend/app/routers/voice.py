"""
CivicLens Voice Transcription Router

Endpoint: POST /api/voice/transcribe
Accepts audio binary/form data or JSON base64 payload and returns text transcript.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/voice", tags=["Voice AI"])


class VoiceBase64Payload(BaseModel):
    audio_base64: str
    content_type: Optional[str] = "audio/webm"
    language: Optional[str] = "en-IN"


@router.post("/transcribe")
async def transcribe_audio_file(
    file: Optional[UploadFile] = File(None),
    language: Optional[str] = Form("en-IN"),
    payload: Optional[VoiceBase64Payload] = None
):
    """
    Transcribe audio file or base64 audio stream into text.
    """
    audio_bytes = None
    content_type = "audio/webm"
    target_lang = language or "en-IN"

    if file:
        audio_bytes = await file.read()
        content_type = file.content_type or "audio/webm"
    elif payload and payload.audio_base64:
        import base64
        try:
            audio_bytes = base64.b64decode(payload.audio_base64)
            content_type = payload.content_type or "audio/webm"
            target_lang = payload.language or "en-IN"
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 audio data")

    if not audio_bytes or len(audio_bytes) < 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio data provided")

    result = VoiceService.transcribe_audio(
        audio_bytes=audio_bytes,
        content_type=content_type,
        language=target_lang
    )

    return result
