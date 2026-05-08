from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.database import Database

from backend.app.db import get_db
from backend.app.models import (
    DAY_ENTRY_COLLECTION,
    MOOD_COLLECTION,
    TASK_COLLECTION,
    serialize_day_entry,
    serialize_task,
    utc_now,
)
from backend.app.schemas import DayEntryOut, DayEntryUpsert, TaskCreate, TaskOut, TaskUpdate
from backend.routes.auth import get_current_user


router = APIRouter(prefix="/entries", tags=["entries"])
task_router = APIRouter(prefix="/tasks", tags=["tasks"])


def parse_object_id(value: str, detail: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        ) from exc


def validate_month_day(month: str, day: int) -> tuple[str, int]:
    month_name = month.strip()
    if not month_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Month is required")
    if day < 1 or day > 31:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Day must be between 1 and 31")
    return month_name, day


def load_entry_with_tasks(db: Database, entry: dict) -> DayEntryOut:
    task_documents = db[TASK_COLLECTION].find({"day_entry_id": entry["_id"]}).sort("created_at", 1)
    tasks = [serialize_task(task) for task in task_documents]
    return DayEntryOut(**serialize_day_entry(entry, tasks))


@router.get("", response_model=list[DayEntryOut])
def list_entries(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[DayEntryOut]:
    entries = list(
        db[DAY_ENTRY_COLLECTION]
        .find({"user_id": current_user["_id"]})
        .sort([("month", 1), ("day", 1), ("created_at", 1)])
    )

    if not entries:
        return []

    entry_ids = [entry["_id"] for entry in entries]
    task_documents = list(
        db[TASK_COLLECTION].find({"day_entry_id": {"$in": entry_ids}}).sort("created_at", 1)
    )
    tasks_by_entry: dict[ObjectId, list[dict]] = {}
    for task in task_documents:
        tasks_by_entry.setdefault(task["day_entry_id"], []).append(serialize_task(task))

    return [
        DayEntryOut(**serialize_day_entry(entry, tasks_by_entry.get(entry["_id"], [])))
        for entry in entries
    ]


@router.get("/{month}/{day}", response_model=DayEntryOut)
def get_entry(
    month: str,
    day: int,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> DayEntryOut:
    month_name, day_number = validate_month_day(month, day)
    entry = db[DAY_ENTRY_COLLECTION].find_one(
        {"user_id": current_user["_id"], "month": month_name, "day": day_number}
    )
    if not entry:
        now = utc_now()
        result = db[DAY_ENTRY_COLLECTION].insert_one(
            {
                "user_id": current_user["_id"],
                "month": month_name,
                "day": day_number,
                "mood_id": None,
                "note": "",
                "created_at": now,
                "updated_at": now,
            }
        )
        entry = db[DAY_ENTRY_COLLECTION].find_one({"_id": result.inserted_id})
    return load_entry_with_tasks(db, entry)


@router.put("/{month}/{day}", response_model=DayEntryOut)
def upsert_entry(
    month: str,
    day: int,
    payload: DayEntryUpsert,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> DayEntryOut:
    month_name, day_number = validate_month_day(month, day)
    mood_object_id = None
    if payload.mood_id:
        mood_object_id = parse_object_id(payload.mood_id, "Invalid mood id")
        mood_exists = db[MOOD_COLLECTION].find_one(
            {"_id": mood_object_id, "user_id": current_user["_id"]}
        )
        if not mood_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood not found")

    existing = db[DAY_ENTRY_COLLECTION].find_one(
        {"user_id": current_user["_id"], "month": month_name, "day": day_number}
    )
    now = utc_now()
    updates = {
        "mood_id": mood_object_id,
        "note": payload.note,
        "updated_at": now,
    }

    if existing:
        db[DAY_ENTRY_COLLECTION].update_one({"_id": existing["_id"]}, {"$set": updates})
        entry = db[DAY_ENTRY_COLLECTION].find_one({"_id": existing["_id"]})
    else:
        result = db[DAY_ENTRY_COLLECTION].insert_one(
            {
                "user_id": current_user["_id"],
                "month": month_name,
                "day": day_number,
                "mood_id": mood_object_id,
                "note": payload.note,
                "created_at": now,
                "updated_at": now,
            }
        )
        entry = db[DAY_ENTRY_COLLECTION].find_one({"_id": result.inserted_id})

    return load_entry_with_tasks(db, entry)


@router.post("/{month}/{day}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    month: str,
    day: int,
    payload: TaskCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> TaskOut:
    month_name, day_number = validate_month_day(month, day)
    entry = db[DAY_ENTRY_COLLECTION].find_one(
        {"user_id": current_user["_id"], "month": month_name, "day": day_number}
    )
    now = utc_now()
    if not entry:
        result = db[DAY_ENTRY_COLLECTION].insert_one(
            {
                "user_id": current_user["_id"],
                "month": month_name,
                "day": day_number,
                "mood_id": None,
                "note": "",
                "created_at": now,
                "updated_at": now,
            }
        )
        entry = db[DAY_ENTRY_COLLECTION].find_one({"_id": result.inserted_id})

    task_document = {
        "day_entry_id": entry["_id"],
        "text": payload.text.strip(),
        "done": False,
        "created_at": now,
        "updated_at": now,
    }
    result = db[TASK_COLLECTION].insert_one(task_document)
    created = db[TASK_COLLECTION].find_one({"_id": result.inserted_id})
    return TaskOut(**serialize_task(created))


@task_router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> TaskOut:
    task_object_id = parse_object_id(task_id, "Invalid task id")
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided")
    if "text" in updates:
        updates["text"] = updates["text"].strip()
    updates["updated_at"] = utc_now()

    task = db[TASK_COLLECTION].find_one({"_id": task_object_id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    entry = db[DAY_ENTRY_COLLECTION].find_one(
        {"_id": task["day_entry_id"], "user_id": current_user["_id"]}
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db[TASK_COLLECTION].update_one({"_id": task_object_id}, {"$set": updates})
    updated = db[TASK_COLLECTION].find_one({"_id": task_object_id})
    return TaskOut(**serialize_task(updated))


@task_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Response:
    task_object_id = parse_object_id(task_id, "Invalid task id")
    task = db[TASK_COLLECTION].find_one({"_id": task_object_id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    entry = db[DAY_ENTRY_COLLECTION].find_one(
        {"_id": task["day_entry_id"], "user_id": current_user["_id"]}
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db[TASK_COLLECTION].delete_one({"_id": task_object_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
