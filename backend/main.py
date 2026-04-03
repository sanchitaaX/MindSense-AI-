from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from routers import face_analysis, text_analysis, chat, voucher  # type: ignore
import os
from limiter import limiter  # type: ignore
from slowapi import _rate_limit_exceeded_handler  # type: ignore
from slowapi.errors import RateLimitExceeded  # type: ignore
from slowapi.middleware import SlowAPIMiddleware  # type: ignore

app = FastAPI(title="MindSense AI Backend", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Always include the production frontend URL.
# Additional origins can be added via ALLOWED_ORIGINS env var (comma-separated).
BASE_ORIGINS = [
    "https://mind-sense.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

extra_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
extra_origins = [o.strip() for o in extra_origins_raw.split(",") if o.strip()]

allowed_origins = list(dict.fromkeys(BASE_ORIGINS + extra_origins))  # deduplicate, preserve order

print(f"[MindSense] CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_analysis.router, prefix="/api")
app.include_router(text_analysis.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(voucher.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "mindsense-backend", "allowed_origins": allowed_origins}
