from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.database import Database

from backend.app.db import get_db
from backend.app.models import HABIT_COLLECTION, serialize_habit, utc_now
from backend.app.schemas import HabitCreate, HabitOut, HabitUpdate
from backend.routes.auth import get_current_user


router = APIRouter(prefix="/habits", tags=["habits"])


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid habit id",
        ) from exc


@router.get("", response_model=list[HabitOut])
def list_habits(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[HabitOut]:
    habits = list(
        db[HABIT_COLLECTION]
        .find({"user_id": current_user["_id"]})
        .sort([("created_at", 1), ("_id", 1)])
    )
    return [HabitOut(**serialize_habit(habit)) for habit in habits]


@router.post("", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(
    payload: HabitCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> HabitOut:
    now = utc_now()
    result = db[HABIT_COLLECTION].insert_one(
        {
            "user_id": current_user["_id"],
            "text": payload.text.strip(),
            "done": False,
            "created_at": now,
            "updated_at": now,
        }
    )
    habit = db[HABIT_COLLECTION].find_one({"_id": result.inserted_id})
    return HabitOut(**serialize_habit(habit))


@router.patch("/{habit_id}", response_model=HabitOut)
def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> HabitOut:
    habit_object_id = parse_object_id(habit_id)
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided")
    if "text" in updates:
        updates["text"] = updates["text"].strip()
    updates["updated_at"] = utc_now()

    habit = db[HABIT_COLLECTION].find_one(
        {"_id": habit_object_id, "user_id": current_user["_id"]}
    )
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    db[HABIT_COLLECTION].update_one({"_id": habit_object_id}, {"$set": updates})
    updated_habit = db[HABIT_COLLECTION].find_one({"_id": habit_object_id})
    return HabitOut(**serialize_habit(updated_habit))


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Response:
    habit_object_id = parse_object_id(habit_id)
    result = db[HABIT_COLLECTION].delete_one(
        {"_id": habit_object_id, "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
