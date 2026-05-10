import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db import init_db
from backend.app.schemas import HealthResponse
from backend.routes.auth import router as auth_router
from backend.routes.entries import router as entries_router
from backend.routes.entries import task_router
from backend.routes.habits import router as habits_router
from backend.routes.moods import router as moods_router


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent

load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("FRONTEND_URLS") or os.getenv("FRONTEND_URL", "")
    origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://daydex.vercel.app",
    ]

    for default_origin in defaults:
        if default_origin not in origins:
            origins.append(default_origin)

    return origins


allowed_origins = get_allowed_origins()

app = FastAPI(title="Daydex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


app.include_router(auth_router)
app.include_router(moods_router)
app.include_router(entries_router)
app.include_router(task_router)
app.include_router(habits_router)
