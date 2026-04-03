from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
import os
import json
import asyncio
from typing import List, Optional
from limiter import limiter
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    risk_score: Optional[float] = 50.0

SYSTEM_PROMPT = """You are MindSense, an empathetic mental health AI. Validate emotions and guide users. Not a therapist. If danger expressed, provide resources: iCall 9152987821, Vandrevala 1860-2662-345. Be concise, human, never diagnose."""

CRISIS_PROMPT = """You are MindSense in Crisis Support Mode. The user's distress signals are very high. Be extremely compassionate, use de-escalation language, active listening, and gently encourage them to reach out to the professional resources listed in their dashboard. Keep responses calm, validating, and focused on safety. Do not diagnose, but prioritize empathetic connection and resource guidance."""

@router.post("/chat")
@limiter.limit("20/minute")
async def chat_stream(request: Request, body: ChatRequest):
    try:
        # Determine prompt based on risk score
        active_prompt = CRISIS_PROMPT if body.risk_score and body.risk_score > 75 else SYSTEM_PROMPT
        
        # Prepare messages
        messages = [{"role": "system", "content": active_prompt}]
        for msg in body.messages[-6:]: # Keep last 6 for context
            messages.append({"role": msg.role, "content": msg.content})

        def generate():
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                stream=True,
                max_tokens=300,
                temperature=0.7,
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'text': content})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        print(f"[ChatRouter] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
