# Daydex Backend Code Walkthrough

This file explains the code of the backend in a slow, clear way.

I am assuming:

- you know Python syntax
- you do **not** have backend experience
- you do **not** have FastAPI experience
- you do **not** have MongoDB backend experience

So this explanation will do two things at the same time:

1. explain what the code is doing
2. explain the backend concepts behind the code

The goal is that after reading this file, you should be able to open the backend files and understand:

- what each file is for
- why each function exists
- how a request flows through the backend
- how authentication works
- how data is stored in MongoDB
- how FastAPI turns Python functions into API routes


## 1. Big Picture First

Before looking at each file, we need the overall mental model.

### What the backend is supposed to do

The Daydex backend has 4 major jobs:

1. connect to MongoDB
2. authenticate users through Google
3. issue app JWT tokens
4. store and return user data:
   - moods
   - day entries
   - notes
   - tasks

### What happens when a user uses the app

The flow looks like this:

1. User opens the React frontend
2. User signs in with Google
3. Frontend gets a Google credential token
4. Frontend sends that token to FastAPI
5. FastAPI verifies it with Google
6. FastAPI creates or updates the user in MongoDB
7. FastAPI creates a JWT for Daydex
8. Frontend stores that JWT
9. Frontend sends that JWT when calling protected routes
10. Backend checks the JWT and returns the correct user's data

That is the "story" behind the code.


## 2. Backend File Structure

The main backend files are:

```text
backend/
  app/
    __init__.py
    db.py
    main.py
    models.py
    schemas.py
  routes/
    __init__.py
    auth.py
    moods.py
    entries.py
  requirements.txt
```

We will explain them in this order:

1. `app/__init__.py`
2. `routes/__init__.py`
3. `app/db.py`
4. `app/models.py`
5. `app/schemas.py`
6. `routes/auth.py`
7. `routes/moods.py`
8. `routes/entries.py`
9. `app/main.py`

That order is good because:

- `db.py` explains where data comes from
- `models.py` explains how Mongo documents are shaped
- `schemas.py` explains what request/response data looks like
- route files use all of that
- `main.py` ties everything together


## 3. `app/__init__.py`

File:

`app/__init__.py`

This file is empty.

### Why an empty file matters

In Python, an empty `__init__.py` file tells Python:

"treat this folder like a package"

That means imports like this work:

```python
from app.db import get_db
```

Without `__init__.py`, Python package imports can behave differently depending on version/setup.

So even though it has no code, it is useful.


## 4. `routes/__init__.py`

File:

`routes/__init__.py`

This file is also empty.

It has the same purpose:

- marks `routes/` as a Python package

So imports like this work:

```python
from routes.auth import router
```


## 5. `app/db.py`

File:

`db.py`

Here is the code again:

```python
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
```

### Line by line explanation

#### `import os`

This imports Python's `os` module.

We use it to read environment variables:

```python
os.getenv("MONGODB_URI")
```

#### `from pathlib import Path`

`Path` is a modern way to work with file paths in Python.

It is used here to find:

- the current file
- the backend folder
- the project folder

#### `from dotenv import load_dotenv`

This comes from `python-dotenv`.

It allows Python to read values from a `.env` file and put them into environment variables.

That means a line like:

```env
MONGODB_URI=...
```

can be loaded and later read with:

```python
os.getenv("MONGODB_URI")
```

#### `from pymongo import MongoClient`

This is the MongoDB client class.

It is how Python connects to MongoDB.

Think of `MongoClient(...)` as:

- "open a connection to MongoDB"

#### `from pymongo.database import Database`

This is used only as a type hint.

Type hints do not change runtime behavior.

They help:

- readability
- auto-complete
- static checking


### Path setup

```python
BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
```

Let us understand this carefully.

Suppose the file is:

```text
backend/app/db.py
```

Then:

- `__file__` -> current file path
- `.resolve()` -> absolute full path
- `.parents[1]` -> go up one level to `backend/`
- `.parent` on `backend/` -> go up to project root `daydex/`

So:

- `BASE_DIR` means `backend/`
- `PROJECT_DIR` means repo/project root


### Loading `.env` files

```python
load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")
```

This means:

1. try loading `daydex/.env`
2. then try loading `daydex/backend/.env`

Why do this?

Because during development or deployment, env files may exist in different places.

This gives some flexibility.


### Reading env vars

```python
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "daydex")
```

This says:

- read `MONGODB_URI`
- read `MONGODB_DB_NAME`
- if `MONGODB_DB_NAME` is missing, use `"daydex"`

The second argument to `os.getenv()` is the default value.


### Safety check

```python
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set in the environment")
```

This is a defensive check.

If the database connection string is missing, the app should fail immediately and clearly.

That is better than failing later in confusing ways.


### Creating the Mongo client

```python
client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]
```

This creates:

- a MongoDB client
- then selects a specific database by name

If `MONGODB_DB_NAME = "daydex"`, this is basically:

- connect to MongoDB
- use the database named `daydex`


### `get_db()`

```python
def get_db() -> Database:
    return db
```

This looks small, but it is important.

FastAPI uses a system called **dependency injection**.

When a route says:

```python
db: Database = Depends(get_db)
```

FastAPI calls `get_db()` and passes the result into the route.

So `get_db()` is the official way routes access the database.


### `init_db()`

```python
def init_db() -> None:
```

This function creates indexes.

It runs when the app starts.

Why create indexes?

- faster queries
- uniqueness guarantees

Let us look at each one.

#### `users.create_index("google_sub", unique=True)`

Each Google account has a unique stable Google user id called `sub`.

We do not want the same Google account inserted twice, so this is unique.

#### `users.create_index("email", unique=True, sparse=True)`

This means:

- if email exists, it must be unique
- but missing email is allowed because of `sparse=True`

#### `moods.create_index([("user_id", 1), ("name", 1)], unique=True)`

This is a compound index.

It means:

- for a given user
- mood name must be unique

So one user cannot have two mood presets both named `"Good"`.

#### `day_entries.create_index([("user_id", 1), ("month", 1), ("day", 1)], unique=True)`

This ensures:

- one user has only one entry for each month-day pair

For example:

- only one entry for `March 9` for that user

#### `tasks.create_index([("day_entry_id", 1)])`

This speeds up looking up tasks for a particular day entry.


## 6. `app/models.py`

File:

`models.py`

Code:

```python
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
```

and similar serializer functions for users, tasks, and day entries.

### Important concept here

In SQL projects, a file named `models.py` often contains ORM classes like:

```python
class User(Base):
    ...
```

But here we are using MongoDB directly with `pymongo`.

So this file is not an ORM model file.

Instead it is a:

- constants file
- utility file
- serializer file


### Collection constants

```python
USER_COLLECTION = "users"
MOOD_COLLECTION = "moods"
DAY_ENTRY_COLLECTION = "day_entries"
TASK_COLLECTION = "tasks"
```

These are just string constants.

Instead of repeating `"users"` all over the code, we write:

```python
USER_COLLECTION
```

That reduces typos and keeps names consistent.


### `utc_now()`

```python
def utc_now() -> datetime:
    return datetime.now(UTC)
```

This gives the current time in UTC.

Why UTC?

Because it is the safest standard time format for backend systems.

If later you deploy users in different countries, storing server times in local timezone becomes messy.


### `object_id_str()`

MongoDB ids are often `ObjectId` objects, not normal strings.

But JSON responses need plain serializable values.

So:

```python
def object_id_str(value: Any) -> str | None:
```

does this:

- if value is `None`, return `None`
- if value is an `ObjectId`, convert it to string
- otherwise still convert it to string

This is mainly used when building API responses.


### Serializer functions

Example:

```python
def serialize_user(document: dict[str, Any]) -> dict[str, Any]:
```

This function takes a MongoDB document like:

```python
{
    "_id": ObjectId("..."),
    "google_sub": "...",
    "email": "...",
}
```

and converts it into a cleaner API response dict:

```python
{
    "id": "string version of _id",
    "google_sub": "...",
    "email": "...",
}
```

Why not return the Mongo document directly?

Because:

- Mongo uses `_id`, not `id`
- `ObjectId` is not frontend-friendly
- we want consistent response shapes


### `serialize_day_entry()`

This serializer has one extra idea:

```python
def serialize_day_entry(document, tasks=None)
```

The day entry document itself is stored in one collection.

The tasks are stored separately in another collection.

So when returning a full day entry response to the frontend, we want:

- day entry fields
- plus a `tasks` list

That is why `tasks` is a parameter instead of something read directly from the entry document.


## 7. `app/schemas.py`

File:

`schemas.py`

This file contains **Pydantic schemas**.

These schemas define:

- what request bodies should look like
- what response bodies should look like
- validation rules

### Why schemas exist

Suppose a route expects:

- a note string
- or a task text string

If a user sends the wrong type, FastAPI can reject it automatically before your route logic even runs.

That is one of the biggest conveniences of FastAPI.


### Imports

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
```

#### `BaseModel`

This is the base class for Pydantic models.

Every schema class inherits from this.

#### `Field`

Used to add validation rules like:

- minimum length
- maximum length
- numeric ranges

#### `EmailStr`

Used when we want Pydantic to validate that a string looks like an email.

#### `ConfigDict`

Used to configure some schema behavior.


### Small schemas first

#### `APIMessage`

```python
class APIMessage(BaseModel):
    message: str
```

This is a simple one-field schema for responses like:

```json
{"message": "something"}
```

It currently is not the main focus of this backend, but it is a common pattern.

#### `HealthResponse`

```python
class HealthResponse(BaseModel):
    status: str
```

Used by `/health`.


### Auth schemas

#### `GoogleAuthRequest`

```python
class GoogleAuthRequest(BaseModel):
    credential: str = Field(min_length=20)
```

This means the request body for Google sign-in must look like:

```json
{
  "credential": "some long token string"
}
```

And that string must have at least 20 characters.

#### `UserOut`

This is the user response schema.

Fields:

- `id`
- `google_sub`
- `email`
- `name`
- `picture`
- timestamps

Why is `email` optional?

Because some providers or flows may not always return every field. Optional handling makes the schema more robust.

#### `TokenResponse`

```python
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
```

This means `/auth/google` returns:

- a JWT token
- token type
- the logged-in user's info


### Mood schemas

#### `MoodBase`

```python
class MoodBase(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    color: str = Field(min_length=1, max_length=50)
    percent: int = Field(ge=0, le=100)
```

This base class holds the shared fields for mood objects.

Why use a base class?

Because:

- `MoodCreate`
- `MoodOut`

both need the same main fields.

This avoids repeating code.

#### `MoodCreate`

This inherits from `MoodBase` with no changes.

It means creating a mood requires exactly those base fields.

#### `MoodUpdate`

This one is different.

All fields are optional:

```python
name: str | None = ...
```

because when updating, the client may send only one changed field.

#### `MoodOut`

This is the response version of a mood.

It includes:

- all mood fields
- plus `id`
- plus `user_id`
- plus timestamps


### Task schemas

#### `TaskCreate`

Used when adding a new task.

It only needs:

- `text`

#### `TaskUpdate`

Used when changing a task.

It allows:

- changing `text`
- changing `done`

Both are optional so partial updates are possible.

#### `TaskOut`

This is what the backend returns to the frontend after reading or updating a task.


### Day entry schemas

#### `DayEntryUpsert`

Used for:

- `PUT /entries/{month}/{day}`

It contains:

- `mood_id`
- `note`

Why "upsert"?

Because this route:

- updates if the entry exists
- inserts if it does not exist

That is exactly what "upsert" means.

#### `DayEntryOut`

This is the full response for a day.

It includes:

- `id`
- `user_id`
- `month`
- `day`
- `mood_id`
- `note`
- `tasks`
- timestamps


## 8. `routes/auth.py`

File:

`auth.py`

This is one of the most important files because it handles login and user identity.

Code parts:

### Imports

```python
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
```

Let us understand the key ones.

#### `APIRouter`

FastAPI lets you split routes into multiple files.

`APIRouter` is how you define a group of routes.

Later in `main.py`, that router gets attached to the app.

#### `Depends`

FastAPI's dependency injection system.

This is used heavily for:

- database injection
- auth injection

#### `HTTPException`

Used to return proper HTTP errors like:

- 400
- 401
- 404

instead of generic crashes.

#### `HTTPBearer`

This tells FastAPI:

- expect a bearer token in the Authorization header

Example header:

```http
Authorization: Bearer eyJ...
```

#### `jwt`

This library is used to:

- encode JWT tokens
- decode JWT tokens

#### `google.oauth2.id_token`

This is used to verify the Google credential token sent by the frontend.


### Loading env

```python
load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")
```

Same logic as `db.py`.


### Router setup

```python
router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
```

This means all routes in this file start with:

- `/auth`

So:

```python
@router.post("/google")
```

becomes:

- `POST /auth/google`


### Reading auth env vars

```python
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
```

These are critical.

If `GOOGLE_CLIENT_ID` is missing, Google verification cannot work.

If `JWT_SECRET` is missing, our own app JWT cannot work.

So the code raises:

```python
RuntimeError(...)
```

early if those are missing.


### `create_access_token()`

```python
def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expires_at}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
```

This builds our JWT.

Let us break the JWT payload down:

#### `sub`

This is conventionally the "subject" of the token.

In our case:

- the subject is the user id

#### `exp`

This is the expiry time.

The token should become invalid after some time.

#### `HS256`

This is the signing algorithm.

We sign the token using our app secret.


### `get_current_user()`

This is a dependency function.

It is very important.

Routes use it like this:

```python
current_user: dict = Depends(get_current_user)
```

That means:

before running the route:

1. FastAPI extracts the bearer token
2. decodes the JWT
3. finds the user in MongoDB
4. passes that user into the route

#### `credentials: HTTPAuthorizationCredentials = Depends(security)`

This means:

- use the `HTTPBearer()` security helper
- extract the token from the request header

#### JWT decoding

```python
payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
```

This checks:

- token signature
- expiry
- validity

If invalid, it raises an exception.

#### Finding the user

```python
user = db[USER_COLLECTION].find_one({"_id": ObjectId(user_id)})
```

The JWT stores the user id as a string.

Mongo stores `_id` as an `ObjectId`.

So we convert string -> `ObjectId(...)`.

If the user does not exist, we return 401.


### `POST /auth/google`

This is the login route.

Function:

```python
def google_sign_in(payload: GoogleAuthRequest, db: Database = Depends(get_db)) -> TokenResponse:
```

This shows several FastAPI ideas:

- `payload` is automatically parsed from request JSON
- `db` is injected by `Depends(get_db)`
- the returned value is shaped by `TokenResponse`

#### Verifying Google token

```python
token_info = id_token.verify_oauth2_token(
    payload.credential,
    google_requests.Request(),
    GOOGLE_CLIENT_ID,
)
```

This is the line that tells Google:

"please verify this credential token and make sure it belongs to my app client id"

If Google rejects it, we return 401.

#### Extracting user info

```python
google_sub = token_info.get("sub")
email = token_info.get("email")
name = token_info.get("name")
picture = token_info.get("picture")
```

This gives us the identity information from Google.

The most important one is:

- `sub`

because it is Google's stable unique user id.

#### Upsert user

We then check whether a user already exists:

```python
existing_user = users.find_one({"google_sub": google_sub})
```

If yes:

- update email/name/picture/updated_at

If no:

- insert a new document

This is a manual "find or create" pattern.

#### Issue app token

```python
access_token = create_access_token(str(user["_id"]))
```

Now the user is authenticated with Google, and we create our own JWT for Daydex.

Then we return:

```python
TokenResponse(access_token=..., user=...)
```


### `GET /auth/me`

This is a simple protected route.

It uses:

```python
current_user: dict = Depends(get_current_user)
```

So if the token is valid, it returns the user's info.

This is useful on frontend refresh because the app can ask:

"who am I currently logged in as?"


## 9. `routes/moods.py`

File:

`moods.py`

This file handles mood preset CRUD.

### Router

```python
router = APIRouter(prefix="/moods", tags=["moods"])
```

So routes become:

- `GET /moods`
- `POST /moods`
- `PUT /moods/{mood_id}`
- `DELETE /moods/{mood_id}`


### `parse_object_id()`

Mongo ids have to be valid `ObjectId`s.

If a route receives a broken id string, `ObjectId(value)` would raise an exception.

So we catch that and return:

- HTTP 400

instead of crashing.


### `GET /moods`

```python
documents = db[MOOD_COLLECTION].find({"user_id": current_user["_id"]}).sort("created_at", 1)
```

This says:

- find all mood documents
- that belong to the current user
- sort oldest to newest

Then each document is converted with:

```python
MoodOut(**serialize_mood(document))
```

This is a common FastAPI pattern:

1. serialize raw Mongo document to a normal dict
2. pass it into a Pydantic output schema


### `POST /moods`

This creates a new mood.

Input comes in as `MoodCreate`.

Then the backend builds a Mongo document:

```python
document = {
    "user_id": current_user["_id"],
    "name": payload.name.strip(),
    "color": payload.color.strip(),
    "percent": payload.percent,
    "created_at": now,
    "updated_at": now,
}
```

Important idea:

- we do not trust the frontend to send `user_id`
- backend sets `user_id` using the authenticated user

That is critical for security.


### `PUT /moods/{mood_id}`

This updates an existing mood.

#### `payload.model_dump(exclude_none=True)`

This converts the Pydantic object into a dict, but only includes fields that were actually sent.

Example:

If the frontend sends only:

```json
{"color": "bg-red-500"}
```

then `updates` becomes only:

```python
{"color": "bg-red-500"}
```

That is great for partial updates.

#### Ownership check

The update query uses:

```python
{"_id": object_id, "user_id": current_user["_id"]}
```

That means even if a user somehow guesses another mood's id, the query will not update it unless it belongs to that same user.


### `DELETE /moods/{mood_id}`

Very similar pattern:

- parse id
- filter by both `_id` and `user_id`
- delete only if it belongs to current user


## 10. `routes/entries.py`

File:

`entries.py`

This is the biggest route file because day entries and tasks are the biggest data part of Daydex.

This file handles:

- all day entries
- note text
- selected mood for a day
- tasks


### Routers

```python
router = APIRouter(prefix="/entries", tags=["entries"])
task_router = APIRouter(prefix="/tasks", tags=["tasks"])
```

We use two routers:

- one for day-entry routes
- one for task-specific routes


### `parse_object_id(value, detail)`

Similar to the mood file, but this one lets us customize the error message.


### `validate_month_day(month, day)`

This validates:

- month string is not empty
- day is between 1 and 31

This is route-level validation logic.

The route path itself gives `month` and `day`, but we still want extra sanity checks.


### `load_entry_with_tasks()`

This helper function:

1. finds all tasks for a day entry
2. serializes them
3. returns a `DayEntryOut`

This is nice because multiple routes need the exact same "entry + tasks" response shape.

So we put that logic in one helper instead of repeating it.


### `GET /entries`

This route returns **all day entries** for the current user.

Flow:

1. fetch all entries for current user
2. if there are none, return empty list
3. collect all entry ids
4. fetch all tasks whose `day_entry_id` is in those ids
5. group tasks by entry id
6. build final `DayEntryOut` objects

This is a very common backend technique:

- load parent records
- load child records
- group child records by parent id

#### Why not query tasks one-by-one inside a loop?

Because that would cause many repeated database queries.

The current approach is more efficient:

- one query for entries
- one query for tasks


### `GET /entries/{month}/{day}`

This route fetches one day entry.

Interesting detail:

If the entry does not exist, it creates a blank one.

Why?

Because the frontend wants a consistent object to work with.

So instead of:

- returning 404

it creates:

- empty note
- empty mood
- no tasks

That simplifies frontend logic.


### `PUT /entries/{month}/{day}`

This route updates or creates a day entry.

This is the most important route for saving:

- selected mood
- note

#### Mood validation

If `payload.mood_id` exists, we do:

1. convert it to `ObjectId`
2. check if that mood belongs to the current user

That prevents a user from referencing another user's mood id.

#### Upsert logic

We first check whether the day entry already exists:

```python
existing = db[DAY_ENTRY_COLLECTION].find_one(...)
```

If it exists:

- update it

If not:

- insert it

That is why this is called "upsert entry".


### `POST /entries/{month}/{day}/tasks`

This route adds a task for a specific day.

Interesting detail:

If the day entry does not exist yet, it creates one first.

That means the frontend does not have to worry about manually creating a day entry before task creation.

This is good backend design because it makes the API easier to use.


### `PATCH /tasks/{task_id}`

This updates a task.

Flow:

1. validate task id
2. extract only changed fields
3. find the task
4. find the parent day entry
5. verify the day entry belongs to current user
6. update the task
7. return the updated task

#### Why do we verify through the day entry?

Because tasks do not directly store `user_id`.

They store:

- `day_entry_id`

So to verify ownership we must:

1. find the task
2. find the day entry it belongs to
3. check that the entry belongs to the current user


### `DELETE /tasks/{task_id}`

Same idea as `PATCH`:

- validate task id
- find task
- find parent entry
- check ownership
- delete task


## 11. `app/main.py`

File:

`main.py`

This file is the entry point of the FastAPI app.

Let us walk through it carefully.

### Imports

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
```

#### `FastAPI`

This creates the actual app object.

Think of it like:

- the main server application container

#### `CORSMiddleware`

This is the middleware that controls which frontend origins are allowed to call the backend in browsers.

Without this, the browser blocks cross-origin requests.


### Loading env

Same pattern as other files.


### `get_allowed_origins()`

```python
def get_allowed_origins() -> list[str]:
```

This function builds the list of allowed frontend origins.

It first checks:

- `FRONTEND_URLS`
- else `FRONTEND_URL`

Then it splits comma-separated values into a list.

Then it adds default safe dev/prod origins:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://daydex.vercel.app`

This means even if the env only contains one production origin, local dev can still work too.


### Creating the app

```python
app = FastAPI(title="Daydex API", version="0.1.0")
```

This is the app object.

Everything else gets attached to this.


### Adding CORS middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This tells the backend:

- these origins may call me
- credentials are allowed
- all methods are allowed
- all headers are allowed

This is why frontend calls from localhost or Vercel can reach Render.


### Startup event

```python
@app.on_event("startup")
def on_startup() -> None:
    init_db()
```

This means:

when the app starts, run `init_db()`

That ensures indexes are created without needing a separate manual command.


### Health route

```python
@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")
```

This is a simple route used to check whether the server is alive.

FastAPI automatically turns this function into:

- `GET /health`

### Why `response_model=HealthResponse` matters

It tells FastAPI:

- this route returns a `HealthResponse`

That improves:

- validation
- docs
- consistency


### Including routers

```python
app.include_router(auth_router)
app.include_router(moods_router)
app.include_router(entries_router)
app.include_router(task_router)
```

This is how route files get connected to the main app.

Without this, the route files would exist, but the app would not expose them.


## 12. How FastAPI Turns Functions Into Routes

This is worth explaining clearly because it may feel new if you have only written plain Python scripts.

Example:

```python
@router.get("/health")
def health_check():
    return {"status": "ok"}
```

The `@router.get(...)` is called a **decorator**.

It tells FastAPI:

"This Python function should run when a GET request comes to this path."

So a normal Python function becomes an API endpoint.


## 13. How `Depends(...)` Works

Example:

```python
def some_route(db: Database = Depends(get_db)):
```

This means:

- before calling `some_route`
- FastAPI should call `get_db()`
- and pass its result into `db`

This is a very important pattern in FastAPI.

We use it for:

- database access
- authentication

Example:

```python
current_user: dict = Depends(get_current_user)
```

FastAPI runs auth logic before the route body.


## 14. How JWT Protection Works In Practice

When the frontend sends:

```http
Authorization: Bearer <token>
```

and a route includes:

```python
current_user: dict = Depends(get_current_user)
```

then this happens:

1. FastAPI extracts the bearer token
2. `get_current_user()` runs
3. token is decoded
4. user is looked up in MongoDB
5. if valid, user doc is passed into the route
6. if invalid, the route never runs and 401 is returned


## 15. How MongoDB Documents Look In This Project

### User document

```python
{
    "_id": ObjectId(...),
    "google_sub": "...",
    "email": "...",
    "name": "...",
    "picture": "...",
    "created_at": ...,
    "updated_at": ...
}
```

### Mood document

```python
{
    "_id": ObjectId(...),
    "user_id": ObjectId(...),
    "name": "Good",
    "color": "bg-lime-500",
    "percent": 0,
    "created_at": ...,
    "updated_at": ...
}
```

### Day entry document

```python
{
    "_id": ObjectId(...),
    "user_id": ObjectId(...),
    "month": "March",
    "day": 9,
    "mood_id": ObjectId(...) or None,
    "note": "some note",
    "created_at": ...,
    "updated_at": ...
}
```

### Task document

```python
{
    "_id": ObjectId(...),
    "day_entry_id": ObjectId(...),
    "text": "Finish work",
    "done": False,
    "created_at": ...,
    "updated_at": ...
}
```


## 16. A Full Example Request Walkthrough

Let us follow one request all the way through.

### Example: `POST /auth/google`

Frontend sends:

```json
{
  "credential": "google-token"
}
```

Step by step:

1. FastAPI receives the request
2. It sees the route expects `GoogleAuthRequest`
3. Pydantic validates the body
4. The route function runs
5. `verify_oauth2_token(...)` verifies the Google token
6. MongoDB is checked for an existing user
7. user is updated or inserted
8. JWT is created
9. `TokenResponse` is returned
10. frontend receives:
   - token
   - user object


### Example: `PUT /entries/March/9`

Frontend sends:

```json
{
  "mood_id": "some-mongo-id",
  "note": "Today was nice"
}
```

Step by step:

1. FastAPI sees protected route
2. `get_current_user()` runs first
3. JWT is decoded
4. current user is loaded
5. `DayEntryUpsert` validates the body
6. month/day are validated
7. mood id is validated and ownership checked
8. existing entry is found or a new one is created
9. data is saved
10. full day entry response is returned


## 17. Why This Code Is Written This Way

You may wonder why the code is split like this rather than one giant file.

The separation helps:

### `db.py`

- only database connection logic

### `models.py`

- only constants + serializers + helpers

### `schemas.py`

- only request/response definitions

### route files

- only endpoint logic

### `main.py`

- only app wiring

This kind of separation makes backend projects much easier to maintain as they grow.


## 18. Important Python/Backend Concepts You Just Used

By building and reading this backend, you are already using:

- modules
- packages
- environment variables
- decorators
- dependency injection
- request validation
- bearer auth
- JWT encoding/decoding
- MongoDB queries
- serialization
- startup hooks
- middleware

That is a lot of backend material.


## 19. Things That May Feel Weird At First

These are some parts that often confuse people new to backend work.

### "Why do routes look like normal functions?"

Because in FastAPI they **are** normal Python functions with decorators attached.

### "Why does FastAPI inject arguments?"

Because `Depends(...)` tells FastAPI to build those values for you before calling the function.

### "Why not just return Mongo documents directly?"

Because Mongo documents contain types and field names that are not frontend-friendly.

### "Why do we need both Google token and JWT?"

Because:

- Google proves who the user is
- Daydex's JWT is the app's own session token for later API requests


## 20. Suggested Way To Study These Files

If you want to learn this code properly, open the files in this order:

1. `db.py`
2. `models.py`
3. `schemas.py`
4. `auth.py`
5. `moods.py`
6. `entries.py`
7. `main.py`

Why this order?

- first understand how DB is accessed
- then understand data shapes
- then see how routes use them
- finally see how everything gets attached to the app


## 21. Final Summary In Very Simple Words

If I explain the whole backend in the simplest possible way:

- `db.py` connects Python to MongoDB
- `models.py` helps convert Mongo data into clean JSON
- `schemas.py` defines what data should look like
- `auth.py` logs users in with Google and creates JWTs
- `moods.py` stores the mood presets
- `entries.py` stores day notes, selected moods, and tasks
- `main.py` creates the FastAPI app and plugs all routes together

That is the entire backend.


## 22. What To Read Next If You Want To Go Deeper

After understanding this code, the next useful backend topics to learn are:

- what HTTP methods mean: GET, POST, PUT, PATCH, DELETE
- what status codes mean: 200, 201, 204, 400, 401, 404
- how JWT works internally
- how MongoDB stores documents and collections
- how FastAPI dependencies work
- how middleware works
- how to add tests for routes


## 23. Best Way To Practice After Reading This

If you want to really learn, try changing one small thing yourself.

Good beginner exercises:

1. add a new field to mood presets
2. add a route to rename all tasks of a day
3. add a route to delete all tasks of a day
4. add a `completed_tasks_count` field in the response
5. return month entries sorted in a custom way

Those small edits will teach you more than reading alone.
