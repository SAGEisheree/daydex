from datetime import UTC, datetime
from typing import Any

from bson import ObjectId


USER_COLLECTION = "users"
MOOD_COLLECTION = "moods"
DAY_ENTRY_COLLECTION = "day_entries"
TASK_COLLECTION = "tasks"


def utc_now() -> datetime:
    return datetime.now(UTC)


def object_id_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def serialize_mood(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": object_id_str(document["_id"]),
        "user_id": object_id_str(document["user_id"]),
        "name": document["name"],
        "color": document["color"],
        "percent": document["percent"],
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def serialize_user(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": object_id_str(document["_id"]),
        "google_sub": document["google_sub"],
        "email": document.get("email"),
        "name": document.get("name"),
        "picture": document.get("picture"),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def serialize_task(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": object_id_str(document["_id"]),
        "day_entry_id": object_id_str(document["day_entry_id"]),
        "text": document["text"],
        "done": document.get("done", False),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def serialize_day_entry(document: dict[str, Any], tasks: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    return {
        "id": object_id_str(document["_id"]),
        "user_id": object_id_str(document["user_id"]),
        "month": document["month"],
        "day": document["day"],
        "mood_id": object_id_str(document.get("mood_id")),
        "note": document.get("note", ""),
        "tasks": tasks or [],
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }
