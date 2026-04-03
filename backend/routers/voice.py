from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import os
import tempfile
import io

router = APIRouter()

# Globals for lazy loading
whisper_model = None
tts_engine = None
torch_device = "cpu"

class TTSRequest(BaseModel):
    text: str
    speed: float = 1.0

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    global whisper_model, torch_device
    
    if audio.content_type not in {
        "audio/webm", "audio/wav", "audio/mpeg",
        "audio/ogg", "audio/mp4", "audio/x-m4a", "application/octet-stream"
    }:
        raise HTTPException(400, "Unsupported audio format")

    if whisper_model is None:
        import whisper
        import torch
        print("[VoiceRouter] Lazy loading Whisper model...")
        torch_device = "cuda" if torch.cuda.is_available() else "cpu"
        WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
        whisper_model = whisper.load_model(WHISPER_MODEL, device=torch_device)
        print("[VoiceRouter] Whisper ready ✓")

    contents = await audio.read()

    # Write to a temp file — Whisper needs a file path
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = whisper_model.transcribe(
            tmp_path,
            language=None,           # auto-detect
            task="transcribe",
            fp16=(torch_device == "cuda"),
            verbose=False,
        )
        return JSONResponse({
            "transcript": result["text"].strip(),
            "language":   result.get("language", "unknown"),
            "segments":   result.get("segments", []),
        })
    except Exception as e:
        print(f"[VoiceRouter] STT Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/tts")
async def text_to_speech(body: TTSRequest):
    global tts_engine, torch_device
    
    text = body.text.strip()
    speed = body.speed

    if not text:
        raise HTTPException(400, "text is required")
    if len(text) > 2000:
        raise HTTPException(400, "text too long (max 2000 chars)")

    if tts_engine is None:
        from TTS.api import TTS as CoquiTTS
        import torch
        print("[VoiceRouter] Lazy loading Coqui TTS model...")
        torch_device = "cuda" if torch.cuda.is_available() else "cpu"
        COQUI_MODEL = os.getenv("COQUI_MODEL", "tts_models/en/jenny/jenny")
        tts_engine = CoquiTTS(COQUI_MODEL).to(torch_device)
        print("[VoiceRouter] Coqui TTS ready ✓")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        out_path = tmp.name

    try:
        # TTS generates directly to file
        tts_engine.tts_to_file(text=text, file_path=out_path, speed=speed)
        
        with open(out_path, "rb") as f:
            audio_bytes = f.read()
            
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={"Content-Disposition": 'inline; filename="speech.wav"'},
        )
    except Exception as e:
        print(f"[VoiceRouter] TTS Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(out_path):
            os.unlink(out_path)
