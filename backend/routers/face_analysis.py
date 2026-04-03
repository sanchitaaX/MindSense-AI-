import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Request  # type: ignore
from pydantic import BaseModel  # type: ignore
import base64
import numpy as np  # type: ignore
import cv2  # type: ignore
from limiter import limiter  # type: ignore

import shutil
from pathlib import Path

# --- DeepFace Bootloader Injection ---
# The official DeepFace v1.0 Github URL is permanently 404. It causes cloud deploys to repeatedly download 
# a 9-byte error file and crash. To fix this, we bundle a valid 5.7MB .h5 weight file and aggressively copy it.
home = str(Path.home())
df_weights_dir = os.path.join(home, ".deepface", "weights")
target_weights = os.path.join(df_weights_dir, "facial_expression_model_weights.h5")
bundled_weights = os.path.join(os.path.dirname(__file__), "..", "models", "facial_expression_model_weights.h5")

os.makedirs(df_weights_dir, exist_ok=True)
if os.path.exists(bundled_weights) and not os.path.exists(target_weights):
    print(f"[Bootloader] Injecting bundled DeepFace weights into {target_weights}...")
    shutil.copy(bundled_weights, target_weights)

# Try to detect if DeepFace is installed without importing it (to prevent Render timeout)
import importlib.util
HAS_DEEPFACE = importlib.util.find_spec("deepface") is not None
if HAS_DEEPFACE:
    print("[FaceAnalysis] ✅ DeepFace detected. Will load lazily on first request.")
else:
    print("[FaceAnalysis] ⚠️ DeepFace not available.")

router = APIRouter()

# OpenCV fallback face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Emotion→distress weights
DISTRESS_EMOTIONS = {"sad": 1.0, "fear": 0.9, "angry": 0.7, "disgust": 0.5}

class ImageRequest(BaseModel):
    image_base64: str

@router.post("/analyze-face")
@limiter.limit("60/minute")
async def analyze_face(request: Request, body: ImageRequest):
    # --- Decode image ---
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

    # --- Step 1: Quick OpenCV face pre-check ---
    # This runs in milliseconds and tells us if there's even a face in frame
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces_quick = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
    
    if len(faces_quick) == 0:
        # No face found by OpenCV — don't even bother calling DeepFace
        print("[FaceAnalysis] ❌ No face detected (OpenCV pre-check)")
        return {
            "emotions": {},
            "dominant_emotion": "no face detected",
            "distress_score": 0.0,
            "engine": "opencv_precheck"
        }

    # --- Step 2: DeepFace emotion analysis (face confirmed by OpenCV) ---
    if HAS_DEEPFACE:
        try:
            from deepface import DeepFace  # type: ignore
            results = DeepFace.analyze(
                img,
                actions=["emotion"],
                enforce_detection=False,  # We already confirmed face exists above
                detector_backend="opencv",
                silent=True
            )

            result = results[0] if isinstance(results, list) else results
            raw_emotions = result.get("emotion", {})
            dominant = result.get("dominant_emotion", "neutral")

            # Normalize to 0-1 (DeepFace returns 0-100)
            total = float(sum(raw_emotions.values()) or 1.0)
            emotions = {str(k): float(round(float(v) / total, 4)) for k, v in raw_emotions.items()}  # type: ignore

            # Weighted distress score
            distress_score = sum(
                emotions.get(e, 0) * w * 100
                for e, w in DISTRESS_EMOTIONS.items()
            )

            # Reduce if happy
            happiness = emotions.get("happy", 0)
            if happiness > 0.35:
                distress_score *= (1 - happiness * 0.85)

            # Clamp score between 0.0 and 95.0 and round
            distress_score = float(max(0.0, min(95.0, float(distress_score))))
            distress_score = round(distress_score, 2)  # type: ignore
            print(f"[FaceAnalysis] ✅ {dominant} | distress={distress_score} | emotions={emotions}")

            return {
                "emotions": emotions,
                "dominant_emotion": dominant,
                "distress_score": distress_score,
                "engine": "DeepFace"
            }

        except Exception as e:
            print(f"[FaceAnalysis] ⚠️ DeepFace error: {e}")
            # Fall through to OpenCV-only response
            return {
                "emotions": {"neutral": 1.0},
                "dominant_emotion": "face detected",
                "distress_score": 5.0,
                "engine": "opencv_fallback",
                "error": str(e)
            }
    else:
        # DeepFace not installed — but OpenCV did find a face
        print("[FaceAnalysis] Face found (OpenCV only, no emotion AI)")
        return {
            "emotions": {"neutral": 1.0},
            "dominant_emotion": "face detected",
            "distress_score": 5.0,
            "engine": "opencv_only"
        }
