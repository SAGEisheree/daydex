# FastAPI to Vercel Serverless Migration Plan

This project can be made serverless without moving the frontend into Next.js.

The simplest path for this repo is:

- Keep `frontend/` as the Vite app
- Keep `backend/` as the FastAPI codebase
- Deploy FastAPI as a serverless Python function on Vercel
- Use `Mangum` as the adapter between FastAPI and Vercel
- Point the Vite frontend to the deployed Vercel backend

This avoids rewriting the backend into Next.js and solves the current issue where Google login depends on a sleeping backend server.

## Current Repo Structure

Important files already in the project:

- `frontend/` contains the Vite frontend
- `frontend/.env` currently points to `http://127.0.0.1:8000`
- `backend/app/main.py` creates the FastAPI app
- `backend/app/db.py` handles MongoDB connection
- `backend/routes/auth.py` handles Google auth and JWT auth
- `backend/routes/moods.py` handles moods CRUD
- `backend/routes/entries.py` handles entries and tasks CRUD
- `requirements.txt` already contains the FastAPI backend dependencies

This means the backend is already organized well enough for a serverless deployment. We do not need to merge it into a single file.

## Goal

Make the FastAPI backend serverless on Vercel so that:

- Google login works anytime without waiting for a Render instance to wake up
- the frontend remains in Vite
- MongoDB Atlas continues to be used as the database
- the API becomes available through a Vercel deployment URL

## Important Clarification

This is serverless, not server-free.

You will no longer run or deploy a separate always-on FastAPI server process, but the backend will still run as Vercel serverless functions when requests come in.

That is exactly what you want for Google login availability.

## Recommended Final Architecture

- `frontend/` stays as the client app
- `backend/` stays as the source of truth for FastAPI logic
- `api/index.py` becomes the Vercel entrypoint
- `vercel.json` routes `/api/*` requests to the Python handler
- Vercel environment variables store secrets
- MongoDB Atlas remains external

## Why This Is Better Than Moving Everything Into Next.js

For this repo, this path is smaller and safer because:

- the frontend does not need to be rewritten
- the backend routes do not need to be rewritten from Python to JavaScript
- your current Google auth flow can be preserved
- your MongoDB code can mostly stay unchanged

## High-Level Migration Steps

1. Add `Mangum` to the backend dependencies.
2. Create a Vercel serverless entrypoint in `api/index.py`.
3. Add a root `vercel.json`.
4. Make sure the FastAPI app can be imported correctly by Vercel.
5. Configure Vercel environment variables.
6. Update CORS for deployed frontend domains.
7. Deploy the backend to Vercel.
8. Point the Vite frontend to the new backend URL.
9. Test Google login, auth persistence, moods, entries, and tasks.

## Detailed File Changes

### 1. Add `Mangum`

Add `mangum` to:

- `requirements.txt`
- optionally `backend/requirements.txt` too, if that file is the one you use during backend-only local development

Why:

- `Mangum` converts ASGI apps like FastAPI into a handler that Vercel can execute

Expected addition:

```txt
mangum
```

### 2. Create `api/index.py`

Create a new file at the repo root:

- `api/index.py`

Purpose:

- This file is the Vercel entrypoint
- It should import the existing FastAPI app from `backend/app/main.py`
- It should expose `handler = Mangum(app)`

Expected shape:

```python
from mangum import Mangum

from backend.app.main import app

handler = Mangum(app)
```

Why this is better than moving everything into `api/index.py`:

- your backend is already modular
- routes stay in `backend/routes/`
- database logic stays in `backend/app/db.py`
- future maintenance stays clean

### 3. Add `vercel.json`

Create a root file:

- `vercel.json`

Purpose:

- tells Vercel how to route incoming requests
- ensures `/api/*` goes to the Python serverless handler

Example structure:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    }
  ]
}
```

This keeps the deployed backend URL shape consistent with your frontend API usage.

### 4. Verify Import Paths

Vercel must be able to import:

```python
from backend.app.main import app
```

Things to verify:

- `backend/app/__init__.py` already exists
- `backend/routes/__init__.py` already exists
- Python import resolution works from the repo root

Potential issue:

- `backend/app/main.py` currently imports `from app.db import init_db` and `from routes.auth import router as auth_router`
- these imports may work locally depending on execution context, but Vercel import resolution is stricter

Safer long-term option:

- update imports to package-based imports such as `from backend.app.db import init_db`
- update route imports similarly if needed

This is one of the main things to test before deployment.

## Backend-Specific Notes For This Repo

### FastAPI App

Your FastAPI app is already defined in:

- `backend/app/main.py`

It already:

- loads environment variables
- sets CORS
- connects routers
- initializes MongoDB indexes on startup

That is good for serverless as long as the imports and env loading behave correctly.

### MongoDB

Your MongoDB setup in:

- `backend/app/db.py`

already uses MongoDB Atlas through `MONGODB_URI`.

That is serverless-friendly because:

- Vercel functions can connect to Atlas
- no local database server is required

Things to keep an eye on:

- connection reuse in serverless environments
- cold starts
- network latency

But for a small app like this, this architecture is normal and acceptable.

### Google Login

Your Google auth flow currently lives in:

- `backend/routes/auth.py`

It verifies a Google credential token using:

- `google.oauth2.id_token`

This is compatible with a Vercel Python serverless deployment as long as:

- `GOOGLE_CLIENT_ID` is present in environment variables
- the frontend origin is allowed in CORS
- the frontend calls the correct deployed `/api/auth/google` endpoint

### JWT Auth

Your backend currently issues JWTs using:

- `JWT_SECRET`

This can stay exactly the same in serverless mode.

The frontend already stores the token and sends it in the `Authorization` header.

That means:

- no auth redesign is required for this migration

## Environment Variables

These backend env vars must be added in the Vercel dashboard for the backend project:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` if used later or needed for expanded auth flows
- `JWT_SECRET`
- `FRONTEND_URL` or `FRONTEND_URLS`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ENVIRONMENT`

Recommended values:

- `FRONTEND_URL=https://your-frontend-domain.vercel.app`

If multiple origins are needed, use:

- `FRONTEND_URLS=https://your-frontend-domain.vercel.app,http://localhost:5173`

This matters because your FastAPI app builds allowed origins from these env vars.

## CORS Changes

Your current CORS logic is in:

- `backend/app/main.py`

It already supports:

- `FRONTEND_URLS`
- `FRONTEND_URL`

Current defaults include:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://daydex.vercel.app`

What you need to do:

- ensure the actual frontend deployment URL is included
- keep localhost values for local frontend development

If the frontend stays on Vite and is deployed separately, CORS must allow that deployed domain.

## Frontend Changes

The frontend changes should be minimal.

### 1. Update API Base URL

File:

- `frontend/.env`

Current value:

```txt
VITE_API_URL=http://127.0.0.1:8000
```

After deployment, update it to something like:

```txt
VITE_API_URL=https://your-backend-project.vercel.app/api
```

This works because the frontend API helper in:

- `frontend/src/lib/api.js`

already prepends the configured base URL.

### 2. Keep Google Client ID

File:

- `frontend/.env`

Current variable:

```txt
VITE_GOOGLE_CLIENT_ID=...
```

This can stay as-is.

The frontend Google sign-in button logic does not need to be rewritten just because the backend becomes serverless.

## Deployment Steps On Vercel

### 1. Push the repository to GitHub

Make sure the repo contains:

- `api/index.py`
- `vercel.json`
- updated `requirements.txt`

### 2. Create a new Vercel project

In the Vercel dashboard:

- click `Add New Project`
- select this repository

### 3. Set the Root Directory

If deploying the backend from the repo root:

- keep the root as the project root

This works because:

- `api/` and `vercel.json` live at the root
- `backend/` is importable from there

### 4. Add Environment Variables

Before first production testing, add:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET`
- `FRONTEND_URL` or `FRONTEND_URLS`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

### 5. Deploy

Vercel should detect Python dependencies from `requirements.txt` and create the serverless function.

## Local Development Strategy

You do not need to stop local backend development just because production becomes serverless.

You can keep using:

- local FastAPI for development
- deployed Vercel backend for production

Possible local modes:

- run FastAPI locally and keep `VITE_API_URL=http://127.0.0.1:8000`
- or point the local frontend to the deployed Vercel API during testing

This gives flexibility while migrating.

## Testing Checklist

After deployment, test these in order:

1. Open the backend health endpoint.
   Example: `https://your-backend.vercel.app/api/health`
2. Test Google sign-in from the deployed frontend.
3. Confirm `/auth/google` returns a token.
4. Confirm `/auth/me` works with the stored token.
5. Create a mood.
6. Update a mood.
7. Delete a mood.
8. Open an entry by month/day.
9. Save notes to an entry.
10. Add a task.
11. toggle a task complete/incomplete.
12. delete a task.
13. reload the frontend and confirm cloud data persists.

## Risks and Things To Watch

### 1. Import Path Issues

Most likely migration issue:

- Vercel may fail to import the FastAPI app if imports are too dependent on local execution context

If this happens:

- convert relative/local-style imports to fully package-qualified imports

### 2. Cold Starts

Serverless functions can still have cold starts.

But compared to a sleeping container on Render:

- startup should usually feel much better

### 3. CORS Misconfiguration

If Google sign-in or API calls fail in the browser:

- CORS is one of the first places to check

### 4. Environment Variable Mismatch

If deployment works locally but fails on Vercel:

- missing env vars are a common cause

### 5. Python Runtime Packaging

If a dependency fails during deployment:

- confirm it is listed in `requirements.txt`
- keep root `requirements.txt` aligned with backend runtime needs

## Minimum Actual Work Required

The smallest practical migration for this repo is:

1. Add `mangum` to requirements.
2. Add `api/index.py`.
3. Add `vercel.json`.
4. Fix any import-path issues.
5. Set Vercel env vars.
6. Change `frontend/.env` to the deployed API URL.

That is much smaller than:

- moving everything into `with_nextjs`
- rewriting the backend in Next.js
- rebuilding the frontend

## Final Recommendation

For this project, the best migration path is:

- keep Vite frontend
- keep FastAPI backend
- make FastAPI serverless using `Mangum` on Vercel

This gives the biggest benefit for the least rewrite effort and directly addresses the Google login availability problem.

## Implementation Order

Use this order when actually making changes:

1. Add `mangum` to `requirements.txt`
2. Create `api/index.py`
3. Create `vercel.json`
4. Test importability of the FastAPI app
5. Clean up any backend import issues
6. Deploy backend to Vercel
7. Add backend env vars in Vercel
8. Update `frontend/.env`
9. Test all auth and CRUD flows

## Optional Cleanup After Migration

Once the backend deployment works well, you can optionally:

- remove old Render deployment config if any exists
- document the new deployment URL
- document required env vars in a README
- consolidate duplicate dependency files if you no longer need both root and backend requirements files
