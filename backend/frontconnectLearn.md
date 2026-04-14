# Daydex Frontend-Backend Connection Notes

This file explains how the frontend is connected to the backend in Daydex.

This is not only about "which URL is called". It is about the full connection story:

- how the frontend knows where the backend is
- how the frontend sends requests
- how the frontend stores login state
- how Google login is connected to FastAPI
- how mood data is loaded
- how day entries are loaded
- how tasks are loaded and updated
- how backend responses are turned into React state

I will explain this assuming:

- you know some Python
- you know some JavaScript/React basics
- you are new to the idea of frontend and backend talking to each other


## 1. Big Picture First

Let us first understand what "frontend connected to backend" actually means.

### Frontend

The frontend is the React app.

Its job is:

- show UI
- handle clicks
- handle text input
- show data
- call the backend when it needs real data

### Backend

The backend is the FastAPI app.

Its job is:

- authenticate users
- verify JWT tokens
- read/write MongoDB
- return JSON data

### Database

MongoDB is the actual storage layer.

So the real chain is:

```text
User -> React frontend -> FastAPI backend -> MongoDB
```

and then back:

```text
MongoDB -> FastAPI backend -> React frontend -> User sees data
```


## 2. What Data Is Stored Where

This is important because not everything should live in the same place.

### Still stored in localStorage

The frontend still stores some UI-only things locally:

- theme state like `aquaState`
- JWT token
- a local fallback copy of mood items

Why?

Because these are either:

- UI preferences
- or useful quick local values

### Stored in the cloud through backend

The important app data is stored in MongoDB:

- mood presets
- selected mood for each day
- note text for each day
- tasks for each day
- user account data

That is what makes the app usable across browsers/devices.


## 3. Where the Frontend Learns the Backend URL

The frontend must know **which backend server to call**.

That is handled in:

- `frontend/src/lib/api.js`

Code:

```js
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
```

### What this means

The frontend first checks:

- `import.meta.env.VITE_API_URL`

This is the Vite way of reading frontend environment variables.

If it is missing, it falls back to:

- `http://127.0.0.1:8000`

So:

- in local development, you can use your local FastAPI server
- in production, you set `VITE_API_URL` to your Render URL

Example:

```env
VITE_API_URL=https://daydex-1.onrender.com
```


## 4. Why Frontend Env Variables Start With `VITE_`

This is a Vite rule.

Only variables starting with `VITE_` are exposed to browser-side code.

So this works:

```env
VITE_API_URL=...
VITE_GOOGLE_CLIENT_ID=...
```

But this would **not** be available inside React:

```env
API_URL=...
GOOGLE_CLIENT_ID=...
```

That is why the frontend env file uses `VITE_...`.


## 5. The API Helper File: `api.js`

File:

`frontend/src/lib/api.js`

Code:

```js
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_STORAGE_KEY = "daydex_token";
```

This file centralizes the common frontend-backend logic.

That is a good design choice because otherwise each component would have repeated `fetch(...)` code.

### `TOKEN_STORAGE_KEY`

This is the localStorage key name used for the app JWT.

The token is stored under:

- `daydex_token`

### Token helper functions

These functions are simple wrappers around localStorage:

```js
getStoredToken()
setStoredToken(token)
clearStoredToken()
```

They exist so the rest of the app does not directly repeat:

```js
localStorage.getItem(...)
localStorage.setItem(...)
localStorage.removeItem(...)
```


### `apiRequest(...)`

This is the most important helper function in the frontend-backend connection.

Code:

```js
export async function apiRequest(path, { method = "GET", token, body } = {}) {
```

This function lets the frontend do things like:

```js
apiRequest("/auth/me", { token })
apiRequest("/moods", { method: "POST", token, body: mood })
```

### What the function does

1. create headers
2. if body exists, set `Content-Type: application/json`
3. if token exists, add `Authorization: Bearer <token>`
4. call `fetch(...)`
5. if response fails, extract error message and throw an Error
6. if response is `204 No Content`, return `null`
7. otherwise return parsed JSON


### How path joining works

This line:

```js
fetch(`${API_BASE_URL}${path}`, ...)
```

means:

- if `API_BASE_URL = https://daydex-1.onrender.com`
- and `path = /auth/google`

then the final URL becomes:

```text
https://daydex-1.onrender.com/auth/google
```

This is why `VITE_API_URL` must be the backend root only.

It should be:

```env
VITE_API_URL=https://daydex-1.onrender.com
```

It should **not** include `/auth` or `/docs`.


### Why errors are thrown

If the backend responds with:

- `400`
- `401`
- `404`
- `500`

then this helper throws a JavaScript `Error`.

That lets the caller handle it in `try/catch`.

This is much cleaner than checking `response.ok` manually inside every component.


## 6. The Main Connection Brain: `realpage.jsx`

The main file that connects most frontend logic to the backend is:

- `frontend/src/things/realpage.jsx`

This file is the central controller for cloud data.

It handles:

- login
- token restoration
- loading moods
- loading entries
- saving moods
- saving day entries
- creating/updating/deleting tasks

You can think of `RealPage` as:

- the main frontend "data coordinator"


## 7. Main Frontend State In `RealPage`

These states are important:

```js
const [items, setItems] = useLocalStorage("mooditems", DEFAULT_MOODS);
const [aqua, setAqua] = useLocalStorage("aquaState", false);
const [user, setUser] = useState(null);
const [token, setToken] = useState(() => getStoredToken());
const [authReady, setAuthReady] = useState(false);
const [authError, setAuthError] = useState("");
const [syncStatus, setSyncStatus] = useState("local");
const [entriesByKey, setEntriesByKey] = useState({});
```

Let us understand each one.

### `items`

This is the list of mood preset items used by the app.

Each item looks like:

```js
{
  id: "...",
  name: "Good",
  color: "bg-lime-500",
  percent: 0
}
```

These are displayed in the mood card and also used by the day grid.

### `aqua`

Theme state.

This is frontend-only.

### `user`

The currently logged-in user returned from the backend.

### `token`

The Daydex JWT token used for authenticated API requests.

This is restored from localStorage on page load:

```js
const [token, setToken] = useState(() => getStoredToken());
```

That means if the user refreshes the page, the app does not instantly forget who they are.

### `authReady`

Used to indicate whether the Google Sign-In system is loaded and ready.

### `authError`

Used to show login or API-related errors in the UI.

### `syncStatus`

Used to show:

- `"local"`
- `"cloud"`

This is a UI status string telling the user whether cloud sync is active.

### `entriesByKey`

This is the most important state for day data.

It stores all day entries as an object keyed like:

```js
{
  "March-9": { ...entry data... },
  "March-10": { ...entry data... }
}
```

That makes lookup easy.


## 8. Why `entriesByKey` Exists

The frontend renders a whole year-like grid of days.

Each day needs to quickly know:

- selected mood
- note text
- tasks

If we stored entries only as a list, every day component would have to keep searching through the list.

Using:

```js
entriesByKey["March-9"]
```

is much faster and simpler.

The helper for this is:

```js
const entryKey = (month, day) => `${month}-${day}`;
```


## 9. Google Sign-In Flow In the Frontend

The frontend does not directly ask the backend to show a Google popup.

Instead the browser loads Google's client library using:

- a script in `frontend/index.html`

Then `realpage.jsx` initializes the Google button.

### Main variables used

```js
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const signInContainerRef = useRef(null);
const googleInitializedRef = useRef(false);
const renderedThemeRef = useRef(null);
const authCallbackRef = useRef(null);
```

### Why `GOOGLE_CLIENT_ID` is in frontend env

Because the browser needs to know which Google client to use for the sign-in button.

This value is not a secret.

The frontend uses:

- `VITE_GOOGLE_CLIENT_ID`


### `authCallbackRef.current = async (response) => { ... }`

This callback runs after Google successfully returns a credential.

What it does:

1. receives Google's response
2. sends the credential to backend:
   - `POST /auth/google`
3. backend verifies it
4. backend returns:
   - app JWT
   - user object
5. frontend stores the JWT in localStorage
6. frontend stores the token in React state
7. frontend stores the user in React state

That is the critical frontend-backend auth bridge.


### The actual call

```js
const authResponse = await apiRequest("/auth/google", {
  method: "POST",
  body: { credential: response.credential },
});
```

This is the line where frontend hands control to backend auth.

The backend then becomes responsible for:

- verifying Google
- finding/creating user
- issuing JWT


### Storing the backend token

```js
setStoredToken(authResponse.access_token);
setToken(authResponse.access_token);
setUser(authResponse.user);
```

This has two layers:

- localStorage storage through `setStoredToken(...)`
- React state through `setToken(...)`

Why both?

Because:

- localStorage keeps login after refresh
- React state lets the current session use the token immediately


## 10. Restoring the Logged-In Session

This happens in a `useEffect(...)` that depends on `token`.

Code idea:

```js
useEffect(() => {
  if (!token) return;
  ...
}, [token, setItems]);
```

### What happens when a token exists

The frontend runs:

1. `GET /auth/me`
2. `GET /moods`
3. `GET /entries`

### Why `/auth/me` first?

Because it confirms:

- the token is valid
- the backend still recognizes this user

If `/auth/me` fails, the frontend clears the token and returns to logged-out mode.


### Loading the user

```js
const me = await apiRequest("/auth/me", { token });
setUser(me);
```

The JWT is sent automatically in the Authorization header because `apiRequest(...)` sees the `token` argument.


### Loading cloud moods

```js
const remoteMoods = await apiRequest("/moods", { token });
```

Then:

- if backend has no moods yet, default moods are created
- otherwise cloud moods are used

That means the app "seeds" initial mood presets for a fresh account.


### Loading cloud entries

```js
const remoteEntries = await apiRequest("/entries", { token });
```

Then those entries are converted into `entriesByKey`:

```js
const nextEntries = Object.fromEntries(
  remoteEntries.map((entry) => [entryKey(entry.month, entry.day), entry])
);
setEntriesByKey(nextEntries);
```

This is a very important line.

It turns:

```js
[
  { month: "March", day: 9, ... },
  { month: "March", day: 10, ... }
]
```

into:

```js
{
  "March-9": {...},
  "March-10": {...}
}
```

That makes access easy for the day grid.


## 11. How the Frontend Uses the Token In Requests

Protected backend routes need a JWT.

Example:

```js
apiRequest("/moods", { token })
```

Inside `apiRequest(...)`, this becomes:

```js
headers.Authorization = `Bearer ${token}`;
```

So the real HTTP request contains:

```http
Authorization: Bearer eyJ...
```

The backend then uses `get_current_user(...)` to decode and verify it.


## 12. How the Frontend Uses Mood Data

Mood presets are loaded from backend into:

```js
items
```

These are then passed into:

- `MoodCard`
- `Month`

### Why mood presets matter to the day grid

Each day entry stores:

- `mood_id`

That is only the id of the chosen mood preset.

So to render the actual day color, the day component does:

```js
const activeMood = items.find((item) => item.id === selectedMoodID);
```

That means:

- find the mood preset whose id matches the saved day mood id
- use its color class

So:

- mood presets are one data source
- day entries point to them through `mood_id`


## 13. How `Month` Receives Cloud Data

`RealPage` passes several props into `Month`:

```js
<Month
  items={items}
  aqua={aqua}
  entriesByKey={entriesByKey}
  onSaveEntry={saveEntry}
  onAddTask={addTask}
  onUpdateTask={updateTask}
  onDeleteTask={deleteTask}
  cloudEnabled={Boolean(token)}
/>
```

This means `Month` is not responsible for talking to the backend directly.

Instead:

- `RealPage` holds the real data and API logic
- `Month` just passes the right slice down to each `Day`

This is a common React design:

- parent component owns data
- child components receive props


## 14. How `Month` Finds the Right Entry For Each Day

Inside `month.jsx`, every day does:

```js
entry={entriesByKey[`${name}-${day}`]}
```

So if:

- month = `"March"`
- day = `"9"`

then it looks up:

```js
entriesByKey["March-9"]
```

That entry object is then passed to the `Day` component.


## 15. How `Day.jsx` Uses Cloud Data

The `Day` component receives:

- `entry`
- `items`
- save/update/delete functions
- `cloudEnabled`

### Why it still has local React state

Inside `Day`, we see:

```js
const [selectedMoodID, setSelectedMoodID] = useState(entry?.mood_id ?? null);
const [noteText, setNoteText] = useState(entry?.note ?? "");
```

This is local UI state, not localStorage.

Why do this?

Because the component needs immediate editable values while the user is interacting.

But the source of truth is still the backend-backed `entry`.

That is why we also have:

```js
useEffect(() => {
  setSelectedMoodID(entry?.mood_id ?? null);
  setNoteText(entry?.note ?? "");
}, [entry?.mood_id, entry?.note]);
```

This means:

- whenever backend-derived `entry` changes
- sync the local editable state to match it


## 16. Saving Day Mood and Note

Inside `Day.jsx`, the important helper is:

```js
const saveEntry = async (nextMoodId, nextNote) => { ... }
```

### If cloud is disabled

If the user is not logged in:

```js
if (!cloudEnabled) {
  setSelectedMoodID(nextMoodId);
  setNoteText(nextNote);
  return;
}
```

So the UI still updates locally, but nothing is sent to the backend.

### If cloud is enabled

Then `saveEntry(...)` calls:

```js
const savedEntry = await onSaveEntry(name, Number(day), {
  mood_id: nextMoodId,
  note: nextNote,
});
```

Important:

- `onSaveEntry` is a prop from `RealPage`
- `RealPage` contains the real backend call


### The backend call in `RealPage`

```js
const savedEntry = await apiRequest(`/entries/${month}/${day}`, {
  method: "PUT",
  token,
  body: payload,
});
```

So when the user changes a day's mood or note:

1. `Day` prepares the new values
2. `Day` calls `onSaveEntry(...)`
3. `RealPage.saveEntry(...)` calls backend `PUT /entries/{month}/{day}`
4. backend saves it in MongoDB
5. backend returns full updated day entry
6. frontend updates `entriesByKey`


## 17. Why `upsertEntryState(...)` Exists

In `RealPage`:

```js
const upsertEntryState = (entry) => {
  setEntriesByKey((current) => ({
    ...current,
    [entryKey(entry.month, entry.day)]: entry,
  }));
  return entry;
};
```

This means:

- take the current map of entries
- keep everything
- replace or insert the one updated entry

This is a standard React immutable update pattern.

We do not mutate the old object directly.

We create a new object with:

- all old values
- one changed key


## 18. How Notes Are Saved

In `Day.jsx`, the note textarea uses:

```js
onBlur={() => void saveEntry(selectedMoodID, noteText)}
```

`onBlur` means:

- when the textarea loses focus

So the note is saved when the user clicks away from the note box.

That means note saving is not happening on every single keystroke.

That is a good decision because:

- fewer API requests
- less backend load


## 19. How Task Data Is Connected

Tasks are handled through the `Task` component.

But `Task` itself does **not** call `fetch(...)` directly.

It receives functions as props:

- `onAddTask`
- `onToggleTask`
- `onDeleteTask`

This is a very React-style pattern:

- parent owns the real data and logic
- child receives callbacks


## 20. How Adding a Task Works

In `Task.jsx`, when the user adds a task:

```js
await onAddTask(trimmedTask);
```

That calls the prop passed from `Day.jsx`:

```js
onAddTask={(text) => onAddTask(name, Number(day), text)}
```

That then calls the prop passed from `Month`, which ultimately reaches `RealPage.addTask(...)`.

In `RealPage`:

```js
const createdTask = await apiRequest(`/entries/${month}/${day}/tasks`, {
  method: "POST",
  token,
  body: { text },
});
```

So the final backend call is:

- `POST /entries/{month}/{day}/tasks`

The backend inserts the task into MongoDB and returns the created task.

Then frontend updates local React state:

```js
tasks: [...(currentEntry.tasks ?? []), createdTask]
```

So the UI updates immediately after the backend confirms success.


## 21. How Toggling a Task Works

In `Task.jsx`:

```js
onChange={() => onToggleTask(task.id, !task.done)}
```

That means if a task was `false`, send `true`, and vice versa.

Eventually this reaches `RealPage.updateTask(...)`:

```js
const updatedTask = await apiRequest(`/tasks/${taskId}`, {
  method: "PATCH",
  token,
  body: updates,
});
```

So the backend route used is:

- `PATCH /tasks/{task_id}`

Then the frontend updates the task in the correct day entry:

```js
tasks: currentEntry.tasks.map((task) =>
  task.id === taskId ? updatedTask : task
)
```

That means:

- replace only the one changed task
- keep the others unchanged


## 22. How Deleting a Task Works

In `Task.jsx`:

```js
onClick={() => onDeleteTask(task.id)}
```

Eventually this reaches `RealPage.deleteTask(...)`:

```js
await apiRequest(`/tasks/${taskId}`, {
  method: "DELETE",
  token,
});
```

Then frontend removes it from local state:

```js
tasks: currentEntry.tasks.filter((task) => task.id !== taskId)
```

This means:

- keep every task except the deleted one


## 23. Why the Frontend Keeps Local State Even With a Backend

This is a very important concept.

Some beginners think:

"If there is a backend, why keep any React state?"

Answer:

Because frontend state and backend state solve different problems.

### Backend state

This is the long-term source of truth.

It survives:

- refresh
- browser close
- device change

### Frontend state

This is the immediate in-memory state for UI rendering.

It gives:

- fast rendering
- immediate feedback
- smooth interactions

So the frontend still needs state, but now that state is synchronized with the backend.


## 24. The Full Data Loading Flow After Login

Let us follow what happens after a successful login.

### Step 1: Google returns credential

Frontend receives:

- `response.credential`

### Step 2: Frontend sends it to backend

```js
apiRequest("/auth/google", {
  method: "POST",
  body: { credential: response.credential },
});
```

### Step 3: Backend returns JWT + user

Frontend stores:

- token in localStorage
- token in React state
- user in React state

### Step 4: token-dependent effect runs

Because `token` changed, the `useEffect(...)` for bootstrapping runs.

### Step 5: Frontend requests current user

```js
GET /auth/me
```

### Step 6: Frontend requests cloud moods

```js
GET /moods
```

### Step 7: Frontend requests cloud entries

```js
GET /entries
```

### Step 8: Frontend fills React state

- `setUser(me)`
- `setItems(remoteMoods)`
- `setEntriesByKey(nextEntries)`
- `setSyncStatus("cloud")`

At that point the UI is now backed by cloud data.


## 25. Why `syncStatus` Exists

This state is not required for backend communication, but it helps the user understand the app mode.

Possible values:

- `"local"`
- `"cloud"`

It is shown in the UI so the user knows whether data is being saved only locally or to the cloud.

This is useful because the app supports both:

- logged-out local mode
- logged-in cloud mode


## 26. What Happens If Token Is Invalid

In the token bootstrap effect:

```js
catch {
  clearStoredToken();
  setToken(null);
  setUser(null);
  setSyncStatus("local");
  setEntriesByKey({});
}
```

This means:

- if `/auth/me` or later authenticated loading fails
- assume token is no longer usable
- clear it
- reset app to logged-out mode

This is a very common frontend auth recovery pattern.


## 27. Why the Frontend Does Not Talk To MongoDB Directly

This is worth saying clearly.

The frontend never talks to MongoDB directly.

It always talks to FastAPI.

Why?

Because the frontend should not:

- know database credentials
- run direct database queries
- enforce security rules itself
- verify Google tokens itself

The backend exists exactly to sit between:

- the browser
- and the database


## 28. How the Backend Response Shapes Help the Frontend

The backend returns data in frontend-friendly shapes.

Example mood response:

```json
{
  "id": "someid",
  "user_id": "userid",
  "name": "Good",
  "color": "bg-lime-500",
  "percent": 0
}
```

That is easy for React because:

- ids are strings
- field names are simple
- no Mongo `_id` objects are leaked

If the backend had returned raw Mongo documents, the frontend would be much messier.


## 29. How To Use Backend Data In Frontend Components

This is one of the most practical questions.

Suppose the backend returns:

```js
[
  { id: "1", name: "Good", color: "bg-lime-500", percent: 0 }
]
```

Then in the frontend, you typically:

1. store it in React state
2. pass it as props to child components
3. render from that state

That is exactly what we do with:

```js
setItems(remoteMoods)
```

and later:

```js
<MoodCard items={items} ... />
<Month items={items} ... />
```

The same idea applies to day entries:

```js
setEntriesByKey(nextEntries)
```

and then:

```js
entry={entriesByKey[`${name}-${day}`]}
```


## 30. How To Think About "Get Data" In Frontend

When people say:

"How do I get backend data in the frontend?"

the pattern is almost always:

1. call backend API
2. receive JSON
3. put JSON into React state
4. render UI from React state

In Daydex:

### Get current user

```js
const me = await apiRequest("/auth/me", { token });
setUser(me);
```

### Get moods

```js
const remoteMoods = await apiRequest("/moods", { token });
setItems(remoteMoods);
```

### Get entries

```js
const remoteEntries = await apiRequest("/entries", { token });
setEntriesByKey(...)
```

That is the full pattern.


## 31. How To Think About "Save Data" In Frontend

Saving works like:

1. user changes something in UI
2. call backend API with updated value
3. backend returns saved object
4. update React state with saved object

Examples:

### Save day note/mood

```js
await apiRequest(`/entries/${month}/${day}`, {
  method: "PUT",
  token,
  body: payload,
});
```

### Add task

```js
await apiRequest(`/entries/${month}/${day}/tasks`, {
  method: "POST",
  token,
  body: { text },
});
```

### Update task

```js
await apiRequest(`/tasks/${taskId}`, {
  method: "PATCH",
  token,
  body: updates,
});
```

### Delete task

```js
await apiRequest(`/tasks/${taskId}`, {
  method: "DELETE",
  token,
});
```


## 32. Why The Same Account Works Across Browsers

This is only possible because:

- the real data is in MongoDB
- not just localStorage

If one browser saves:

- note
- selected mood
- task

then another browser using the same logged-in Google account can fetch the same data from backend.

The backend identifies the user through:

- JWT
- which itself came from Google sign-in

So same account = same MongoDB user = same data.


## 33. Why There Can Still Be Delay

The connection works, but there can still be delay due to:

- Render cold starts
- network latency
- loading all entries at startup

This is not because frontend-backend connection is wrong.

It is because cloud requests always take longer than local in-memory data.


## 34. Common Frontend-Backend Problems We Hit

During this project, several issues came up that are very common in real projects.

### Wrong Google origin

Google sign-in failed until the correct frontend origin was added in Google Cloud.

### Wrong backend deployment mode

Render initially tried to run an old Node server because of old root project config.

### CORS problems

Frontend on Vercel and backend on Render are different origins.

So backend had to explicitly allow the frontend origin through CORS.

### Wrong API base URL

If `VITE_API_URL` is wrong, the frontend calls the wrong backend endpoint and gets 404s.


## 35. If You Want To Add A New Backend Route Later

Suppose later you want a new backend route:

- `GET /stats`

To connect it to frontend, the pattern would be:

### Backend side

1. create route in FastAPI
2. return JSON response

### Frontend side

1. call:

```js
const stats = await apiRequest("/stats", { token });
```

2. store in state:

```js
setStats(stats);
```

3. render:

```jsx
<div>{stats.total_days}</div>
```

That is the same exact pattern used across the whole app.


## 36. The Core Pattern To Remember

If you forget everything else, remember this pattern:

### Reading data

```text
frontend event/page load
-> call apiRequest(...)
-> backend returns JSON
-> store JSON in React state
-> render UI
```

### Writing data

```text
user changes UI
-> frontend calls apiRequest(...)
-> backend saves to MongoDB
-> backend returns saved object
-> frontend updates React state
-> UI refreshes
```

That is frontend-backend connection in its simplest form.


## 37. Best Files To Study For Connection Logic

If you specifically want to understand how frontend connects to backend, study these in order:

1. `frontend/src/lib/api.js`
2. `frontend/src/things/realpage.jsx`
3. `frontend/src/things/month.jsx`
4. `frontend/src/things/Day.jsx`
5. `frontend/src/things/task.jsx`
6. `backend/routes/auth.py`
7. `backend/routes/moods.py`
8. `backend/routes/entries.py`

That order helps because:

- `api.js` shows raw request logic
- `realpage.jsx` shows main state and request orchestration
- `month/day/task` show how data is consumed by UI
- backend route files show what the frontend is actually calling


## 38. Final Simple Summary

If I explain the frontend-backend connection of Daydex in one simple paragraph:

The React frontend uses `apiRequest()` to call FastAPI routes. After Google login, the frontend stores the returned Daydex JWT in localStorage and React state. That token is sent in later requests through the `Authorization` header. The backend verifies the token, finds the user, reads or updates MongoDB, and returns JSON. The frontend then stores that JSON in React state such as `items`, `user`, and `entriesByKey`, and the UI renders from that state.


## 39. What To Practice To Understand This Better

If you want to really learn this, try these exercises:

1. Add a new backend route that returns only completed tasks
2. Call that route from `realpage.jsx`
3. Store the response in a new React state variable
4. Render the result in the UI
5. Add a new field to day entries and send it from frontend to backend

These exercises will make the connection pattern feel natural.
