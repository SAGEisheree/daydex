from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.database import Database

from backend.app.db import get_db
from backend.app.models import MOOD_COLLECTION, serialize_mood, utc_now
from backend.app.schemas import MoodCreate, MoodOut, MoodUpdate
from backend.routes.auth import get_current_user


router = APIRouter(prefix="/moods", tags=["moods"])


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mood id",
        ) from exc


@router.get("", response_model=list[MoodOut])
def list_moods(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[MoodOut]:
    documents = db[MOOD_COLLECTION].find({"user_id": current_user["_id"]}).sort("created_at", 1)
    return [MoodOut(**serialize_mood(document)) for document in documents]


@router.post("", response_model=MoodOut, status_code=status.HTTP_201_CREATED)
def create_mood(
    payload: MoodCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> MoodOut:
    now = utc_now()
    document = {
        "user_id": current_user["_id"],
        "name": payload.name.strip(),
        "color": payload.color.strip(),
        "percent": payload.percent,
        "created_at": now,
        "updated_at": now,
    }
    result = db[MOOD_COLLECTION].insert_one(document)
    created = db[MOOD_COLLECTION].find_one({"_id": result.inserted_id})
    return MoodOut(**serialize_mood(created))


@router.put("/{mood_id}", response_model=MoodOut)
def update_mood(
    mood_id: str,
    payload: MoodUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> MoodOut:
    object_id = parse_object_id(mood_id)
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided")

    if "name" in updates:
        updates["name"] = updates["name"].strip()
    if "color" in updates:
        updates["color"] = updates["color"].strip()
    updates["updated_at"] = utc_now()

    result = db[MOOD_COLLECTION].update_one(
        {"_id": object_id, "user_id": current_user["_id"]},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood not found")

    updated = db[MOOD_COLLECTION].find_one({"_id": object_id})
    return MoodOut(**serialize_mood(updated))


@router.delete("/{mood_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mood(
    mood_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> Response:
    object_id = parse_object_id(mood_id)
    result = db[MOOD_COLLECTION].delete_one(
        {"_id": object_id, "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mood not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
