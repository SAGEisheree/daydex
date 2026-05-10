import os
from datetime import UTC, datetime, timedelta

import jwt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pymongo.database import Database

from backend.app.db import BASE_DIR, PROJECT_DIR, get_db
from backend.app.models import USER_COLLECTION, serialize_user, utc_now
from backend.app.schemas import GoogleAuthRequest, TokenResponse, UserOut


load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is not set in the environment")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in the environment")


def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expires_at}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Database = Depends(get_db),
) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        user = db[USER_COLLECTION].find_one({"_id": ObjectId(user_id)})
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


@router.post("/google", response_model=TokenResponse)
def google_sign_in(payload: GoogleAuthRequest, db: Database = Depends(get_db)) -> TokenResponse:
    try:
        token_info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    google_sub = token_info.get("sub")
    email = token_info.get("email")
    name = token_info.get("name")
    picture = token_info.get("picture")

    if not google_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google response did not include a user id",
        )

    users = db[USER_COLLECTION]
    now = utc_now()
    existing_user = users.find_one({"google_sub": google_sub})

    if existing_user:
        users.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "updated_at": now,
                }
            },
        )
        user = users.find_one({"_id": existing_user["_id"]})
    else:
        insert_result = users.insert_one(
            {
                "google_sub": google_sub,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": now,
                "updated_at": now,
            }
        )
        user = users.find_one({"_id": insert_result.inserted_id})

    access_token = create_access_token(str(user["_id"]))
    return TokenResponse(access_token=access_token, user=UserOut(**serialize_user(user)))


@router.get("/me", response_model=UserOut)
def read_me(current_user: dict = Depends(get_current_user)) -> UserOut:
    return UserOut(**serialize_user(current_user))
