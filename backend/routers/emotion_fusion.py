"""
emotion_fusion.py  — Multi-modal emotion fusion router

POST /api/fuse-emotion
  Body: {
    face_emotions?:  { sad, happy, angry, fear, disgust, surprise, neutral }  (0-1 normalised)
    face_dominant?:  str
    text_sentiment?: "positive" | "negative" | "neutral" | "crisis"
    voice_prosody?:  { pitch_low: bool, energy_low: bool, tempo_slow: bool, tremor: bool }
    risk_score?:     float (current EMA risk score, 0-100)
  }

Returns: {
    fused_emotion: str
    fused_score:   float (0-100 distress)
    signals:       dict   (breakdown of each modality's vote)
    reason:        str    (human-readable explanation for the fusion decision)
}
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter()

# ── Distress weights per emotion (shared across modalities) ──────────────────
DISTRESS_W = {
    "sad":      1.00,
    "fear":     0.90,
    "angry":    0.70,
    "disgust":  0.50,
    "surprise": 0.20,
    "neutral":  0.05,
    "happy":   -0.50,   # happiness actively lowers distress
}

# ── Modality weights (face is weakest alone; fusion makes it strong) ─────────
MODAL_W = {
    "face":  0.35,
    "text":  0.45,
    "voice": 0.20,
}

# ── Text-sentiment → distress contribution  ──────────────────────────────────
TEXT_DISTRESS = {
    "positive": -15.0,
    "neutral":    0.0,
    "negative":  25.0,
    "crisis":    55.0,
}

# ── Voice-prosody → distress points (additive) ───────────────────────────────
VOICE_DISTRESS_MAP = {
    "pitch_low":    8.0,    # low pitch correlates with sadness/depression
    "energy_low":  10.0,    # low energy = low mood
    "tempo_slow":   7.0,    # slow speech can indicate low affect
    "tremor":      15.0,    # voice tremor = fear/anxiety
}


class VoiceProsody(BaseModel):
    pitch_low: bool = False
    energy_low: bool = False
    tempo_slow: bool = False
    tremor: bool = False


class FuseEmotionRequest(BaseModel):
    face_emotions: Optional[Dict[str, float]] = None    # 0-1 normalised
    face_dominant: Optional[str] = None
    text_sentiment: Optional[str] = None                # positive/negative/neutral/crisis
    voice_prosody: Optional[VoiceProsody] = None
    risk_score: Optional[float] = None                  # current EMA score (context)


def face_to_distress(emotions: Dict[str, float]) -> tuple[float, str]:
    """Convert normalised face emotion dict → (distress 0-100, dominant emotion)."""
    score = sum(emotions.get(e, 0) * w * 100 for e, w in DISTRESS_W.items())
    dominant = max(emotions, key=lambda k: emotions[k])
    return round(max(0.0, min(100.0, score)), 2), dominant


def text_to_distress(sentiment: str) -> float:
    return TEXT_DISTRESS.get(sentiment.lower(), 0.0)


def voice_to_distress(prosody: VoiceProsody) -> float:
    score = 0.0
    if prosody.pitch_low:  score += VOICE_DISTRESS_MAP["pitch_low"]
    if prosody.energy_low: score += VOICE_DISTRESS_MAP["energy_low"]
    if prosody.tempo_slow: score += VOICE_DISTRESS_MAP["tempo_slow"]
    if prosody.tremor:     score += VOICE_DISTRESS_MAP["tremor"]
    return min(score, 60.0)


def resolve_emotion(
    face_dominant: Optional[str],
    text_sentiment: Optional[str],
    voice_prosody: Optional[VoiceProsody],
    fused_score: float,
) -> str:
    """
    Multi-signal emotion resolution — same logic as the frontend split-mode engine.
    Precedence: crisis text > voice tremor > face dominant > score bucket
    """
    if text_sentiment == "crisis":
        return "crisis"
    if voice_prosody and voice_prosody.tremor:
        return "fear"
    # Face sad signal is usually underreported — boost it if ANY other signal agrees
    if face_dominant in ("sad", "fear"):
        if text_sentiment in ("negative", "crisis") or (
            voice_prosody and (voice_prosody.energy_low or voice_prosody.pitch_low)
        ):
            return face_dominant
    if face_dominant and face_dominant not in ("neutral", "no face detected", ""):
        return face_dominant
    # Fall back to score-based bucket
    if fused_score >= 70:
        return "sad"
    if fused_score >= 40:
        return "neutral"
    return "happy"


@router.post("/fuse-emotion")
async def fuse_emotion(body: FuseEmotionRequest):
    signals: Dict[str, object] = {}
    weighted_scores: list[float] = []
    weights_used: list[float] = []

    # ── Face modality ─────────────────────────────────────────────────────────
    face_distress = 0.0
    face_dominant_out = body.face_dominant or "neutral"

    if body.face_emotions:
        face_distress, inferred_dominant = face_to_distress(body.face_emotions)
        # Prefer the custom-classified dominant over the inferred one
        face_dominant_out = body.face_dominant or inferred_dominant
        signals["face"] = {
            "distress": face_distress,
            "dominant": face_dominant_out,
        }
        weighted_scores.append(face_distress)
        weights_used.append(MODAL_W["face"])

    # ── Text modality ─────────────────────────────────────────────────────────
    text_distress = 0.0
    if body.text_sentiment:
        text_distress = text_to_distress(body.text_sentiment)
        signals["text"] = {
            "sentiment": body.text_sentiment,
            "distress": text_distress,
        }
        weighted_scores.append(text_distress)
        weights_used.append(MODAL_W["text"])

    # ── Voice modality ────────────────────────────────────────────────────────
    voice_distress = 0.0
    if body.voice_prosody:
        voice_distress = voice_to_distress(body.voice_prosody)
        signals["voice"] = {
            "prosody": body.voice_prosody.model_dump(),
            "distress": voice_distress,
        }
        weighted_scores.append(voice_distress)
        weights_used.append(MODAL_W["voice"])

    # ── Weighted fusion ───────────────────────────────────────────────────────
    if weighted_scores:
        total_w = sum(weights_used)
        fused_raw = sum(s * w for s, w in zip(weighted_scores, weights_used)) / total_w
    else:
        fused_raw = body.risk_score or 30.0

    fused_score = round(float(max(0.0, min(100.0, fused_raw))), 2)

    # ── Crisis hard-floor ─────────────────────────────────────────────────────
    if body.text_sentiment == "crisis":
        fused_score = max(fused_score, 75.0)

    # ── Sadness mismatch bonus ────────────────────────────────────────────────
    # If face says neutral but text/voice say negative → add correction
    face_says_neutral = face_dominant_out in ("neutral", "no face detected")
    other_says_distress = (
        text_distress >= 20
        or (body.voice_prosody and (body.voice_prosody.energy_low or body.voice_prosody.pitch_low))
    )
    if face_says_neutral and other_says_distress:
        fused_score = min(100.0, fused_score + 10.0)

    # ── Resolve final emotion ─────────────────────────────────────────────────
    fused_emotion = resolve_emotion(
        face_dominant_out, body.text_sentiment, body.voice_prosody, fused_score
    )

    # ── Human-readable reason ─────────────────────────────────────────────────
    parts = []
    if "face" in signals:
        parts.append(f"face={face_dominant_out}({face_distress:.0f})")
    if "text" in signals:
        parts.append(f"text={body.text_sentiment}({text_distress:.0f})")
    if "voice" in signals:
        parts.append(f"voice({voice_distress:.0f})")
    reason = " + ".join(parts) + f" → {fused_emotion} @ {fused_score}"

    print(f"[FusionRouter] {reason}")

    return {
        "fused_emotion": fused_emotion,
        "fused_score": fused_score,
        "signals": signals,
        "reason": reason,
    }
