from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class APIMessage(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str


class GoogleAuthRequest(BaseModel):
    credential: str = Field(min_length=20)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    google_sub: str
    email: EmailStr | None = None
    name: str | None = None
    picture: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MoodBase(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    color: str = Field(min_length=1, max_length=50)
    percent: int = Field(ge=0, le=100)


class MoodCreate(MoodBase):
    pass


class MoodUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    color: str | None = Field(default=None, min_length=1, max_length=50)
    percent: int | None = Field(default=None, ge=0, le=100)


class MoodOut(MoodBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TaskCreate(BaseModel):
    text: str = Field(min_length=1, max_length=200)


class TaskUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day_entry_id: str
    text: str
    done: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class HabitCreate(BaseModel):
    text: str = Field(min_length=1, max_length=200)


class HabitUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None


class HabitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    text: str
    done: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DayEntryUpsert(BaseModel):
    mood_id: str | None = None
    note: str = Field(default="", max_length=5000)


class DayEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    month: str
    day: int
    mood_id: str | None = None
    note: str = ""
    tasks: list[TaskOut] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None
