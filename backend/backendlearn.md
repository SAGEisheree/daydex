# Daydex Backend Learning Notes

This file is a detailed explanation of the backend that was built for the Daydex project during this chat.

The goal of these notes is not just to say "what files exist", but to explain:

- why we added a backend at all
- how the FastAPI app is structured
- how MongoDB is used
- how Google sign-in works in this project
- how JWT auth works
- how mood/day/task data flows from frontend to backend to database
- how deployment was set up
- what is complete and what can still be improved


## 1. Why We Needed a Backend

Originally Daydex was a frontend-only app.

That means:

- moods were stored in `localStorage`
- per-day selected moods were stored in `localStorage`
- notes were stored in `localStorage`
- tasks were stored in `localStorage`

That works for a personal browser-only app, but it has some big limitations:

- data stays only in one browser
- data is lost if browser storage is cleared
- the same account cannot see the same data on multiple devices
- there is no user authentication
- there is no cloud persistence

Because the goal became "use the app on cloud with Google email login", we needed a backend that could:

- authenticate users
- save their data in a database
- return the same data from any browser/device
- protect each user's data from other users

So we introduced:

- `FastAPI` as the backend framework
- `MongoDB Atlas` as the cloud database
- `Google Identity` for login
- `JWT` for app authentication


## 2. Why FastAPI Was Chosen

FastAPI is a very good fit for this project because:

- it is Python-based
- it is simple to learn
- it gives automatic API docs at `/docs`
- request validation is built in through Pydantic
- it is great for small-to-medium APIs
- it deploys nicely on Render

FastAPI became the main HTTP API that the React frontend talks to.


## 3. Backend Folder Structure

The backend structure we built is:

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
  backendlearn.md
```

### What each file does

`app/main.py`

- creates the FastAPI app
- configures CORS
- runs database initialization on startup
- includes all routers

`app/db.py`

- loads environment variables
- creates the MongoDB client
- selects the correct database
- creates indexes when the app starts

`app/models.py`

- this file does not contain SQLAlchemy models
- because we use MongoDB, it instead contains:
  - collection name constants
  - helper functions for timestamps
  - serializer functions that convert Mongo documents into API-friendly JSON shapes

`app/schemas.py`

- contains Pydantic models
- validates input data from requests
- shapes output data for responses

`routes/auth.py`

- handles Google sign-in
- creates JWT tokens
- verifies app JWT tokens
- provides `/auth/me`

`routes/moods.py`

- CRUD for mood preset items

`routes/entries.py`

- handles per-day entries
- handles notes
- handles selected mood per day
- handles tasks for each day


## 4. Environment Variables

The backend depends on environment variables so secrets and deployment-specific values are not hardcoded into Python files.

The key variables are:

`MONGODB_URI`

- the connection string for MongoDB Atlas

`MONGODB_DB_NAME`

- the Mongo database name, for example `daydex`

`GOOGLE_CLIENT_ID`

- the Google OAuth / Identity client id used to verify Google credentials coming from the frontend

`GOOGLE_CLIENT_SECRET`

- originally added, but in the final frontend Google Identity button flow it is not the critical piece for token verification
- the important value for current verification is the client id

`JWT_SECRET`

- used to sign our own app tokens
- after a user signs in with Google, we issue our own JWT

`FRONTEND_URL`

- used for CORS in simple single-origin mode

`FRONTEND_URLS`

- added later so multiple origins can be allowed
- useful for supporting:
  - local dev on `localhost:5173`
  - local dev on `127.0.0.1:5173`
  - production on Vercel

`ACCESS_TOKEN_EXPIRE_MINUTES`

- sets how long our JWT remains valid


## 5. Database Layer: `db.py`

File:

[db.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/app/db.py)

This file is responsible for connecting the backend to MongoDB.

### What happens in this file

1. It loads `.env` values
2. It reads `MONGODB_URI`
3. It creates a `MongoClient`
4. It selects the configured database
5. It exposes `get_db()` for route dependencies
6. It creates indexes using `init_db()`

### Why indexes matter

Indexes make querying faster and also enforce uniqueness rules where needed.

We created indexes for:

- `users.google_sub` as unique
- `users.email` as unique and sparse
- `moods(user_id, name)` as unique
- `day_entries(user_id, month, day)` as unique
- `tasks.day_entry_id`

### Why these indexes were chosen

`google_sub`

- every Google account has a stable Google user id
- this is the safest unique identity key for the user

`moods(user_id, name)`

- one user should not have repeated mood preset names

`day_entries(user_id, month, day)`

- one user should have only one entry per month-day combination


## 6. "Models" in MongoDB Context: `models.py`

File:

[models.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/app/models.py)

Because we are using MongoDB directly through `pymongo`, we did not define ORM classes.

Instead this file contains:

- collection name constants
- timestamp helper
- serializer helpers

### Collection names

We defined constants like:

- `USER_COLLECTION = "users"`
- `MOOD_COLLECTION = "moods"`
- `DAY_ENTRY_COLLECTION = "day_entries"`
- `TASK_COLLECTION = "tasks"`

This helps avoid magic strings repeated everywhere.

### `utc_now()`

This gives a UTC timestamp for:

- `created_at`
- `updated_at`

This is useful because timestamps should be consistent across time zones.

### Serializer functions

MongoDB documents use `_id` as an `ObjectId`, which is not directly nice for frontend JSON use.

So serializer helpers convert:

- `_id` -> `id`
- `ObjectId(...)` -> string

Examples:

- `serialize_user(...)`
- `serialize_mood(...)`
- `serialize_task(...)`
- `serialize_day_entry(...)`

This makes API responses much easier for React to consume.


## 7. Schemas: `schemas.py`

File:

[schemas.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/app/schemas.py)

This file defines the shape of request and response data.

### Why schemas are important

Without schemas:

- route code becomes messy
- invalid input can slip through
- API docs become weak

With Pydantic schemas:

- FastAPI validates incoming data automatically
- invalid fields produce useful errors
- `/docs` is generated automatically

### Main schemas that were added

#### Health

- `HealthResponse`

Used for:

- `/health`

#### Auth

- `GoogleAuthRequest`
- `UserOut`
- `TokenResponse`

Used for:

- Google login request body
- returning current user
- returning JWT token + user data

#### Moods

- `MoodCreate`
- `MoodUpdate`
- `MoodOut`

These represent mood preset items like:

- name
- color
- percent

#### Entries and Tasks

- `DayEntryUpsert`
- `DayEntryOut`
- `TaskCreate`
- `TaskUpdate`
- `TaskOut`

These represent:

- selected mood for a given day
- note text for a given day
- tasks inside that day


## 8. Main App Setup: `main.py`

File:

[main.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/app/main.py)

This is the entry point of the FastAPI app.

### What it does

1. loads environment variables
2. computes allowed CORS origins
3. creates the FastAPI app
4. registers middleware
5. runs database initialization on startup
6. exposes `/health`
7. includes all routes

### Health route

`GET /health`

This exists so we can quickly verify:

- the app is up
- deployment is alive

### Startup event

The startup hook calls:

- `init_db()`

This creates Mongo indexes automatically when the app starts.

### CORS logic

At first the backend allowed only one frontend origin through:

- `FRONTEND_URL`

That caused trouble once the app moved from local development to Vercel.

So we improved it by allowing:

- a comma-separated `FRONTEND_URLS`
- fallback safe defaults:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `https://daydex.vercel.app`

This was important because browser security blocks cross-origin API requests if the backend does not explicitly allow the frontend origin.


## 9. Authentication Flow: `auth.py`

File:

[auth.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/routes/auth.py)

This file handles:

- Google sign-in
- app JWT creation
- app JWT verification
- current user lookup

### Route: `POST /auth/google`

This is the most important auth route.

### How it works

1. The frontend shows a Google sign-in button
2. The user signs in with Google
3. Google returns a credential token to the browser
4. The frontend sends that credential to:
   - `POST /auth/google`
5. The backend verifies the Google credential using:
   - `google.oauth2.id_token.verify_oauth2_token`
6. The backend extracts:
   - `sub`
   - `email`
   - `name`
   - `picture`
7. The backend checks whether that Google user already exists in MongoDB
8. If yes:
   - update profile info
9. If no:
   - create a new user
10. The backend creates its own JWT
11. The backend returns:
   - `access_token`
   - `token_type`
   - `user`

### Why we do not just trust Google forever

Google authenticates the user.

But our app still needs its own internal token so that the frontend can call:

- `/moods`
- `/entries`
- `/tasks`

without repeatedly re-running a Google popup.

So Google is the identity provider, and Daydex issues its own app session token in JWT form.

### JWT creation

`create_access_token(user_id)`

This function:

- stores the user id in `sub`
- sets an expiry time
- signs the token with `JWT_SECRET`

### JWT verification

`get_current_user(...)`

This dependency:

1. reads the `Authorization: Bearer ...` header
2. decodes the JWT
3. extracts the user id
4. finds the user in MongoDB
5. returns that user document

Routes that require login use:

- `Depends(get_current_user)`

### Route: `GET /auth/me`

This route returns the currently logged-in user from the JWT.

It is used by the frontend to restore logged-in state after refresh.


## 10. Mood Presets: `moods.py`

File:

[moods.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/routes/moods.py)

This file handles CRUD for the mood presets shown in the mood card.

### Why moods were separated into their own route

Mood presets are the reusable options such as:

- SuperGood
- Good
- Not Bad
- Bad

These are different from a particular day's chosen mood.

So they deserve their own collection and route group.

### Routes

`GET /moods`

- returns all mood presets for the current user

`POST /moods`

- creates a new mood preset

`PUT /moods/{mood_id}`

- updates an existing mood preset

`DELETE /moods/{mood_id}`

- deletes a mood preset

### Auth protection

All mood routes require:

- a valid JWT

The mood document stores:

- `user_id`

So every query is filtered by user ownership.

### ObjectId parsing

We added `parse_object_id(...)` to safely validate Mongo ids and return a proper 400 error if the id is malformed.


## 11. Day Entries and Tasks: `entries.py`

File:

[entries.py](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/backend/routes/entries.py)

This file was added later when we realized the app was not really cloud-synced yet.

Originally only the mood presets had been moved to the cloud.

But the important day data was still local:

- day-selected mood
- note text
- tasks

So this route file completed the main backend feature set.

### Data design

We use one `day_entries` collection for day-level data:

- `user_id`
- `month`
- `day`
- `mood_id`
- `note`
- timestamps

We use one `tasks` collection for tasks:

- `day_entry_id`
- `text`
- `done`
- timestamps

### Why tasks were separated from day entries

Tasks are list-like child items.

If tasks were embedded directly in the day entry document, editing them repeatedly would also work, but separate documents keep the data model cleaner and make task CRUD more explicit.

### Routes

`GET /entries`

- returns all entries for the current user
- also returns tasks grouped under each entry

`GET /entries/{month}/{day}`

- gets a specific entry
- if it does not exist, creates a blank one automatically

`PUT /entries/{month}/{day}`

- upserts a day entry
- stores:
  - selected mood id
  - note text

`POST /entries/{month}/{day}/tasks`

- creates a task in that day entry

`PATCH /tasks/{task_id}`

- updates a task

`DELETE /tasks/{task_id}`

- deletes a task

### Ownership protection

This route set carefully ensures a task belongs to a day entry that belongs to the current authenticated user.

That is important because raw Mongo ids alone should never let one user edit another user's data.


## 12. Frontend-Backend Integration Summary

Even though this file is about the backend, the backend only makes sense when we also understand how the frontend uses it.

### Earlier frontend behavior

Before the backend integration:

- everything used `useLocalStorage`
- data was instant but browser-local

### New cloud behavior

After the integration:

- Google sign-in gives a Google credential
- frontend sends credential to backend
- backend returns a JWT
- frontend stores the JWT
- frontend sends that JWT in later requests

### Main frontend API usage

The frontend calls:

- `/auth/google`
- `/auth/me`
- `/moods`
- `/entries`
- `/entries/{month}/{day}`
- `/entries/{month}/{day}/tasks`
- `/tasks/{task_id}`

### Important design decision

We kept:

- theme settings

in localStorage because they are UI preferences.

We moved:

- mood presets
- day-selected moods
- notes
- tasks

to MongoDB because they are the real app data that should sync across devices.


## 13. Google Sign-In Issues We Solved

Several real-world issues came up during this chat.

### Issue: `origin_mismatch`

Problem:

- Google login popup said the app did not comply with OAuth policy
- browser origin was not allowed in Google Cloud

Fix:

- added local frontend origins to Google Cloud Console:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

Later for production:

- `https://daydex.vercel.app`

### Issue: duplicate Google initialization

Problem:

- browser console warned:
  - `google.accounts.id.initialize() is called multiple times`

Cause:

- React dev rendering plus effect behavior caused repeated initialization

Fix:

- made the Google initialization in the frontend happen only once
- rerendered the button only when needed


## 14. Deployment Setup

We split deployment into:

- backend on Render
- frontend on Vercel
- database on MongoDB Atlas

### Backend deployment on Render

We discovered an old repo root `package.json` still pointed to a deleted:

- `backend/server.js`

That caused Render to try to run Node instead of Python.

### Fixes applied

- cleaned up the root `package.json`
- added a backend-local `requirements.txt`
- added a `render.yaml`

File:

[render.yaml](/home/abhinav/Documents/c%20lang/WEBSITES/daydex/render.yaml)

This tells Render:

- root directory: `backend`
- runtime: Python
- build command:
  - `pip install -r requirements.txt`
- start command:
  - `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend deployment on Vercel

Frontend should be deployed with:

- repo root connected
- Vercel root directory set to `frontend`

And env vars like:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`

### Vercel + React Router

Because the app uses client-side routing, Vercel also needs SPA rewrites through `vercel.json`.


## 15. CORS Problems We Solved

When the frontend moved from localhost to Vercel, the backend started rejecting requests.

This happened because browser requests from:

- `https://daydex.vercel.app`

were not included in FastAPI's allowed CORS origins.

### Initial version

Originally the backend allowed only one origin using:

- `FRONTEND_URL`

### Improved version

We later added support for:

- `FRONTEND_URLS`

This lets us support local and deployed frontend origins together.


## 16. Why There Was Delay While Loading

After deployment, the app worked but loading felt slow.

Likely reasons:

- Render cold starts
- `/entries` loading the user's full set of saved entries/tasks
- frontend waiting for cloud data before fully settling UI

This is not a logic bug as much as a hosting/performance tradeoff.

### Possible improvements later

- fetch key resources in parallel
- lazy-load entries by month/day
- cache last known cloud data locally
- use a non-sleeping backend plan


## 17. Limitations of the Current Backend

The backend is functional, but it is not yet the final polished production system.

### Current limitations

- no refresh token system
- JWT is stored client-side rather than using HttpOnly cookies
- all entries are fetched at once
- there is no background sync or realtime mechanism
- no rate limiting
- no structured logging
- no automated tests yet
- no migration system because Mongo is being used in a simpler direct style

### Why that is okay for now

The purpose of this backend was:

- make the app cloud-backed
- make Google sign-in work
- save all user content to MongoDB
- support deployment

It does that.


## 18. Security Notes

Important: several secrets were pasted during the build process.

That means before final production hardening, these should be rotated:

- MongoDB database password
- Google client secret
- JWT secret

Even if nothing bad happened, rotating exposed secrets is good security practice.

### Also recommended later

- move to HttpOnly cookie auth if desired
- validate production CORS origins carefully
- avoid leaving test-wide Atlas IP access rules open forever


## 19. End-to-End Request Flow

This is the full picture of how the system works now.

### Sign in flow

1. user opens frontend
2. frontend shows Google sign-in button
3. user signs in with Google
4. Google returns credential token to frontend
5. frontend sends token to `POST /auth/google`
6. backend verifies token with Google
7. backend upserts user in MongoDB
8. backend issues JWT
9. frontend stores JWT
10. frontend uses JWT for later API calls

### Mood preset flow

1. frontend calls `/moods`
2. backend verifies JWT
3. backend filters by current user id
4. backend returns serialized moods
5. frontend displays them

### Day entry flow

1. user clicks a day
2. user changes selected mood or note
3. frontend calls `PUT /entries/{month}/{day}`
4. backend upserts day entry
5. entry is stored in MongoDB
6. same user can see it in another browser after refresh

### Task flow

1. user adds a task
2. frontend calls `POST /entries/{month}/{day}/tasks`
3. backend creates task linked to that day entry
4. user toggles task done state
5. frontend calls `PATCH /tasks/{task_id}`
6. backend updates task


## 20. Key Learning Summary

The most important backend lessons from this build were:

- a frontend-only app becomes a real multi-device app only after adding backend persistence
- Google sign-in is not the same as app authentication; the app still needs its own session token
- MongoDB with `pymongo` is simple and flexible for a project like this
- serializer helpers are very useful when returning MongoDB data to a React frontend
- CORS is one of the biggest practical issues during deployment
- deployment often fails because of config mismatches, not just code bugs
- moving from localStorage to cloud storage requires rethinking state flow, not just adding API calls


## 21. Files To Study If You Want To Learn This Backend Properly

That order helps because:

- `main.py` shows the app structure
- `db.py` shows how Mongo is connected
- `auth.py` shows identity and JWT flow
- `moods.py` and `entries.py` show real data routes
- `schemas.py` explains the data contract
- `models.py` explains the Mongo document transformation layer


## 22. Final State of the Backend

At the end of this chat, the backend supports:

- health checks
- Google sign-in verification
- JWT-based app auth
- current-user lookup
- mood preset CRUD
- per-day note saving
- per-day selected mood saving
- per-day task CRUD
- MongoDB Atlas persistence
- Render deployment configuration
- CORS support for local + production frontend origins

That means Daydex is no longer a browser-only tracker.

It is now a real cloud-backed app with user authentication and per-user persistent data.
