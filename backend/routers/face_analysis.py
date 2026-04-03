import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Request  # type: ignore
from pydantic import BaseModel  # type: ignore
import base64
import numpy as np  # type: ignore
import cv2  # type: ignore
import shutil
from pathlib import Path

# ── DeepFace Bootloader Injection ─────────────────────────────────────────────
# The official DeepFace v1.0 Github URL is permanently 404. It causes cloud
# deploys to repeatedly download a 9-byte error file and crash.  We bundle a
# valid .h5 weight file and copy it aggressively.
home = str(Path.home())
df_weights_dir = os.path.join(home, ".deepface", "weights")
target_weights = os.path.join(df_weights_dir, "facial_expression_model_weights.h5")
bundled_weights = os.path.join(
    os.path.dirname(__file__), "..", "models", "facial_expression_model_weights.h5"
)

os.makedirs(df_weights_dir, exist_ok=True)
if os.path.exists(bundled_weights) and not os.path.exists(target_weights):
    print(f"[Bootloader] Injecting bundled DeepFace weights into {target_weights}...")
    shutil.copy(bundled_weights, target_weights)

import importlib.util
HAS_DEEPFACE = importlib.util.find_spec("deepface") is not None
if HAS_DEEPFACE:
    print("[FaceAnalysis] ✅ DeepFace detected. Will load lazily on first request.")
else:
    print("[FaceAnalysis] ⚠️ DeepFace not available.")

router = APIRouter()

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ── Distress weights (used in score, NOT in classification) ───────────────────
DISTRESS_WEIGHTS = {"sad": 1.0, "fear": 0.9, "angry": 0.7, "disgust": 0.5}

# ── Custom emotion thresholds ──────────────────────────────────────────────────
# DeepFace's raw 0-100 scores are used here.  Neutral wins only when TRULY
# dominant; other emotions are promoted earlier.
THRESHOLDS = {
    "happy":    25.0,   # needs at least 25% raw probability
    "sad":      10.0,   # reduced threshold — model is very stingy with sad
    "angry":    12.0,
    "fear":     10.0,
    "disgust":   8.0,
    "surprise":  8.0,
    "neutral":  60.0,   # neutral only wins if genuinely overwhelming
}

# Priority order when multiple emotions exceed their threshold
PRIORITY_ORDER = ["fear", "angry", "sad", "disgust", "surprise", "happy", "neutral"]


def classify_emotion(raw: dict) -> tuple[str, float]:
    """
    Custom classifier that replaces DeepFace's naive argmax dominant_emotion.

    Strategy:
      1. Find all emotions that exceed their individual threshold.
      2. Among those, pick the one with highest priority (PRIORITY_ORDER).
      3. If none exceed threshold, fall back to argmax (still better than always neutral).

    Returns (dominant_emotion, confidence_0_to_1)
    """
    eligible = {
        emotion: score
        for emotion, score in raw.items()
        if score >= THRESHOLDS.get(emotion, 50.0)
    }

    if eligible:
        # Pick by priority order (fear > angry > sad > ... > neutral)
        for candidate in PRIORITY_ORDER:
            if candidate in eligible:
                confidence = eligible[candidate] / 100.0
                return candidate, round(confidence, 4)

    # Fallback: plain argmax (neutral likely, but at least it's honest)
    dominant = max(raw, key=lambda k: raw[k])
    return dominant, round(raw[dominant] / 100.0, 4)


def preprocess_frame(img: np.ndarray) -> np.ndarray:
    """
    Lightweight preprocessing to improve DeepFace emotion accuracy:
      - Histogram equalisation per channel (CLAHE) fixes uneven lighting
      - Slight sharpening recovers detail lost in low-res webcam frames
    """
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_ch, a_ch, b_ch = cv2.split(lab)
    l_eq = clahe.apply(l_ch)
    lab_eq = cv2.merge([l_eq, a_ch, b_ch])
    enhanced = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)

    # Mild unsharp mask
    blur = cv2.GaussianBlur(enhanced, (0, 0), 3)
    sharpened = cv2.addWeighted(enhanced, 1.4, blur, -0.4, 0)
    return sharpened


class ImageRequest(BaseModel):
    image_base64: str


@router.post("/analyze-face")
async def analyze_face(request: Request, body: ImageRequest):

    # ── Decode image ──────────────────────────────────────────────────────────
    try:
        header, encoded = body.image_base64.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"[FaceAnalysis] Decode error: {e}")
        return {"dominant_emotion": "error", "distress_score": 0, "error": str(e)}

    if img is None:
        return {"dominant_emotion": "error", "distress_score": 0, "error": "Invalid image"}

    # ── Step 1: Preprocess for better accuracy ────────────────────────────────
    img = preprocess_frame(img)

    # ── Step 2: OpenCV fast face pre-check ───────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces_quick = face_cascade.detectMultiScale(
        gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30)
    )

    if len(faces_quick) == 0:
        print("[FaceAnalysis] ❌ No face detected (OpenCV pre-check)")
        return {
            "emotions": {},
            "dominant_emotion": "no face detected",
            "distress_score": 0.0,
            "engine": "opencv_precheck",
        }

    # ── Step 3: DeepFace emotion analysis ────────────────────────────────────
    if HAS_DEEPFACE:
        try:
            from deepface import DeepFace  # type: ignore

            results = DeepFace.analyze(
                img,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )

            result = results[0] if isinstance(results, list) else results
            raw_emotions: dict = result.get("emotion", {})   # 0-100 scale

            # ── Custom dominant emotion (replaces DeepFace argmax) ────────────
            dominant, confidence = classify_emotion(raw_emotions)

            # ── Normalize to 0-1 for frontend ────────────────────────────────
            # Keep raw scale for threshold logic; normalize separately for display
            total = float(sum(raw_emotions.values()) or 1.0)
            emotions_norm = {
                str(k): float(round(float(v) / total, 4))
                for k, v in raw_emotions.items()
            }

            # ── Distress score using normalized values ────────────────────────
            distress_score = sum(
                emotions_norm.get(e, 0) * w * 100
                for e, w in DISTRESS_WEIGHTS.items()
            )

            # Reduce if genuinely happy
            happiness = emotions_norm.get("happy", 0)
            if happiness > 0.35:
                distress_score *= 1 - happiness * 0.85

            distress_score = round(float(max(0.0, min(95.0, distress_score))), 2)

            print(
                f"[FaceAnalysis] ✅ dominant={dominant} (conf={confidence}) | "
                f"distress={distress_score} | raw={raw_emotions}"
            )

            return {
                "emotions": emotions_norm,
                "raw_emotions": {str(k): round(float(v), 2) for k, v in raw_emotions.items()},
                "dominant_emotion": dominant,
                "confidence": confidence,
                "distress_score": distress_score,
                "engine": "DeepFace+CustomClassifier",
            }

        except Exception as e:
            print(f"[FaceAnalysis] ⚠️ DeepFace error: {e}")
            return {
                "emotions": {"neutral": 1.0},
                "dominant_emotion": "face detected",
                "distress_score": 5.0,
                "engine": "opencv_fallback",
                "error": str(e),
            }

    # ── DeepFace not installed ────────────────────────────────────────────────
    print("[FaceAnalysis] Face found (OpenCV only, no emotion AI)")
    return {
        "emotions": {"neutral": 1.0},
        "dominant_emotion": "face detected",
        "distress_score": 5.0,
        "engine": "opencv_only",
    }
