import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent

load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")


MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "daydex")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set in the environment")


client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]


def get_db() -> Database:
    return db


def init_db() -> None:
    users = db["users"]
    moods = db["moods"]
    day_entries = db["day_entries"]
    tasks = db["tasks"]

    users.create_index("google_sub", unique=True)
    users.create_index("email", unique=True, sparse=True)
    moods.create_index([("user_id", 1), ("name", 1)], unique=True)
    day_entries.create_index([("user_id", 1), ("month", 1), ("day", 1)], unique=True)
    tasks.create_index([("day_entry_id", 1)])
