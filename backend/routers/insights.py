from fastapi import APIRouter, HTTPException # type: ignore
from pydantic import BaseModel # type: ignore
from typing import List
from groq import Groq # type: ignore
import os

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class HistoryEntry(BaseModel):
    date: str
    score: float
    emotion: str

class InsightsRequest(BaseModel):
    history: List[HistoryEntry]

@router.post("/weekly-insight")
async def generate_weekly_insight(body: InsightsRequest):
    try:
        system_prompt = """You are MindSense, an empathetic mental health AI. The user wants a weekly summary based on their daily emotional check-in scores (0=happy, 100=crisis). Write a single, supportive paragraph (3-4 sentences max). Be warm, human, and encouraging. Do not use clinical language. Make them feel genuinely seen. Example tone: 'This was a harder week for you — your scores were higher Tuesday and Wednesday, but you showed up every single day and that matters. Here is what seemed to help.'"""
        
        history_text = "\n".join([f"{entry.date}: Score {entry.score}, Emotion {entry.emotion}" for entry in body.history])
        user_prompt = f"Here is the user's data for the past week:\n{history_text}\nPlease generate the weekly emotional journey insight."
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200,
            temperature=0.6
        )
        
        return {"report": response.choices[0].message.content}
    except Exception as e:
        print(f"[InsightsRouter] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate weekly insight.")
