from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import hashlib
import time
import os
from limiter import limiter

router = APIRouter()

class VoucherRequest(BaseModel):
    user_uid: str
    risk_score: float

@router.post("/generate-voucher")
@limiter.limit("5/minute")
async def generate_voucher(request: Request, body: VoucherRequest):
    try:
        if body.risk_score >= 30:
            raise HTTPException(status_code=400, detail="Risk score too high for voucher")

        # Generate unique code
        raw = f"FIVETREES-{body.user_uid}-{int(time.time())}"
        hash_val = hashlib.sha256(raw.encode()).hexdigest()[:8].upper()
        promo_code = f"FT20-{hash_val}"

        return {
            "code": promo_code,
            "discount": "20%",
            "brand": "Fivetrees Technologies LLP",
            "expiry": "30 days",
            "website": "https://fivetrees.in"
        }
    except Exception as e:
        print(f"[VoucherRouter] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
