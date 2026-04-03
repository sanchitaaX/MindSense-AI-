from fastapi import APIRouter, HTTPException, Request  # type: ignore
from pydantic import BaseModel  # type: ignore

import importlib.util
HAS_TRANSFORMERS = importlib.util.find_spec("transformers") is not None
emotion_analyzer = None  # Will load lazily on first request
_transformer_failed = False  # Track if the transformer crashed so we don't retry

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/analyze-text")
async def analyze_text(request: Request, body: TextRequest):
    global emotion_analyzer, _transformer_failed, HAS_TRANSFORMERS
    has_crisis = False
    try:
        # --- Transformer Path (if available and not previously crashed) ---
        if HAS_TRANSFORMERS and not _transformer_failed:
            try:
                if emotion_analyzer is None:
                    print("[TextAnalysis] Lazy loading HuggingFace emotion model...")
                    from transformers import pipeline  # type: ignore
                    emotion_analyzer = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
                    print("[TextAnalysis] Model loaded successfully.")

                text_input = str(body.text)
                text_truncated = text_input[:512]
                results = emotion_analyzer(text_truncated)[0]
                emotions = {r["label"]: r["score"] for r in results}
                dominant = max(results, key=lambda x: x["score"])["label"]
                
                distress_labels = ["sadness", "fear", "anger", "disgust"]
                distress_score = sum(emotions.get(l, 0) for l in distress_labels) * 100
                has_crisis = distress_score >= 75

                return {
                    "dominant_emotion": dominant,
                    "distress_score": distress_score,
                    "emotions": emotions,
                    "crisis_detected": has_crisis,
                    "python_version_note": "Full AI Active"
                }
            except Exception as transformer_err:
                print(f"[TextAnalysis] ⚠️ Transformer failed, switching to keyword mode: {transformer_err}")
                _transformer_failed = True
                # Fall through to keyword path below

        # --- Keyword Fallback Path (always works) ---
        text_content = str(body.text).lower()
        
        # 1. Negation handling
        negations = ["not suicidal", "don't want to die", "not depressed", "do not feel suicidal", "anymore", "not sad", "no longer"]
        for neg in negations:
            text_content = text_content.replace(str(neg), "")
        
        # 2. High-severity crisis keywords (80 pts each)
        crisis_keywords = ["suicidal", "suicide", "kill myself", "end my life", "want to die", "self harm", "self-harm"]
        
        # 3. Medium-severity distress keywords (40 pts each)
        distress_keywords = ["hopeless", "worthless", "depressed", "die", "hurt", "pain", "suffer", "crying", "alone", "scared", "anxious", "terrified", "abuse", "lonely", "hate", "hates me", "nobody cares", "no one", "ignore", "feel alone", "bad thoughts", "dying"]
        
        # 4. Low-severity sadness keywords (20 pts each)
        sad_keywords = ["sad", "low", "down", "lost", "tired", "stressed", "overwhelmed", "exhausted", "frustrated", "angry", "upset", "broken", "empty", "numb", "help", "bad", "terrible", "awful", "miserable", "unhappy", "crying"]
        
        # 5. Positive keywords (forces rapid decay)
        positive_keywords = ["happy", "good", "fine", "better", "okay", "glad", "joy", "excited", "great", "awesome", "not bad"]
        
        is_positive = any(str(p) in str(text_content) for p in positive_keywords)
        
        score = 0.0
        for k in crisis_keywords:
            if str(k) in str(text_content):
                score += 80.0
                has_crisis = True
        for k in distress_keywords:
            if str(k) in str(text_content): score += 40.0
        for k in sad_keywords:
            if str(k) in str(text_content): score += 20.0
        
        if is_positive and score == 0:
            distress_score = 0.0
            dominant = "happy"
            emotions = {"happy": 1.0, "neutral": 0.0}
        else:
            distress_score = min(95.0, score) if score > 0 else 5.0
            
            if score >= 30: dominant = "crisis"
            elif score >= 15: dominant = "distressed"
            elif score > 0: dominant = "sad"
            else: dominant = "neutral"
            
            emotions = {"neutral": 1.0 - (distress_score/100), dominant: distress_score/100}

        return {
            "dominant_emotion": dominant,
            "distress_score": distress_score,
            "emotions": emotions,
            "crisis_detected": has_crisis,
            "python_version_note": "Keyword Safe Mode Active"
        }
    except Exception as e:
        print(f"Internal Text Error: {e}")
        return {"dominant_emotion": "neutral", "distress_score": 0, "crisis_detected": False, "error": str(e)}
