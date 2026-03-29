import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.schemas import HealthResponse
from routes.auth import router as auth_router
from routes.entries import router as entries_router
from routes.entries import task_router
from routes.moods import router as moods_router


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent

load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")


frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="Daydex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
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
