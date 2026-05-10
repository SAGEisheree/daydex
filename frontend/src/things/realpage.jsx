import { Link } from "react-router";
import { SunMoon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Month from "./month.jsx";
import MoodCard from "./moodCard.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";
import InfoPage from "./infopage.jsx";
import logo from "../assets/logo.svg";
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../lib/api.js";


const DEFAULT_MOODS = [
  { name: "SuperGood", color: "bg-emerald-500", percent: 0 },
  { name: "Good", color: "bg-lime-500", percent: 0 },
  { name: "Not Bad", color: "bg-orange-500", percent: 0 },
  { name: "Bad", color: "bg-red-500", percent: 0 },
];


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";


const entryKey = (month, day) => `${month}-${day}`;

const RealPage = () => {
  const [items, setItems] = useLocalStorage("mooditems", DEFAULT_MOODS);
  const [aqua, setAqua] = useLocalStorage("aquaState", false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [syncStatus, setSyncStatus] = useState("local");
  const [entriesByKey, setEntriesByKey] = useState({});
  const signInContainerRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const renderedThemeRef = useRef(null);
  const authCallbackRef = useRef(null);

  authCallbackRef.current = async (response) => {
    try {
      const authResponse = await apiRequest("/auth/google", {
        method: "POST",
        body: { credential: response.credential },
      });

      setStoredToken(authResponse.access_token);
      setToken(authResponse.access_token);
      setUser(authResponse.user);
      setAuthError("");
      setSyncStatus("cloud");
    } catch (error) {
      setAuthError(error.message);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    let ignore = false;

    const bootstrapUser = async () => {
      try {
        const me = await apiRequest("/auth/me", { token });
        if (!ignore) {
          setUser(me);
        }

        const remoteMoods = await apiRequest("/moods", { token });
        const remoteEntries = await apiRequest("/entries", { token });
        if (!ignore) {
          if (remoteMoods.length === 0) {
            const seededMoods = await Promise.all(
              DEFAULT_MOODS.map((mood) =>
                apiRequest("/moods", { method: "POST", token, body: mood })
              )
            );
            setItems(seededMoods);
          } else {
            setItems(remoteMoods);
          }
          const nextEntries = Object.fromEntries(
            remoteEntries.map((entry) => [entryKey(entry.month, entry.day), entry])
          );
          setEntriesByKey(nextEntries);
          setSyncStatus("cloud");
        }
      } catch (error) {
        const shouldLogout = error?.status === 401 || error?.status === 403;

        if (shouldLogout) {
          clearStoredToken();
        }

        if (!ignore) {
          if (shouldLogout) {
            setToken(null);
            setUser(null);
            setEntriesByKey({});
            setAuthError("Your session expired. Please sign in again.");
          } else {
            setAuthError(error?.message ?? "Unable to restore your session right now.");
          }
          setSyncStatus("local");
        }
      }
    };

    bootstrapUser();

    return () => {
      ignore = true;
    };
  }, [token, setItems]);

  useEffect(() => {
    const googleApi = window.google?.accounts?.id;
    const container = signInContainerRef.current;
    const buttonTheme = aqua ? "filled_black" : "outline";

    if (!GOOGLE_CLIENT_ID) {
      setAuthReady(false);
      setAuthError("Missing VITE_GOOGLE_CLIENT_ID in frontend env.");
      return;
    }

    if (!googleApi || !container) {
      const timer = window.setTimeout(() => {
        setAuthReady(Boolean(window.google?.accounts?.id));
      }, 500);
      return () => window.clearTimeout(timer);
    }

    setAuthError("");
    setAuthReady(true);

    if (!googleInitializedRef.current) {
      googleApi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => authCallbackRef.current?.(response),
      });
      googleInitializedRef.current = true;
    }

    if (!user && renderedThemeRef.current !== buttonTheme) {
      container.innerHTML = "";
      googleApi.renderButton(container, {
        theme: buttonTheme,
        size: "large",
        width: 260,
        text: "signin_with",
        shape: "pill",
      });
      renderedThemeRef.current = buttonTheme;
    }

    if (user) {
      container.innerHTML = "";
      renderedThemeRef.current = null;
    }
  }, [aqua, user]);

  const persistItems = async (nextItems) => {
    setItems(nextItems);

    if (!token) {
      setSyncStatus("local");
      return;
    }

    try {
      const existingIds = new Set(items.map((item) => item.id).filter(Boolean));
      const nextIds = new Set(nextItems.map((item) => item.id).filter(Boolean));

      await Promise.all(
        nextItems.map((item) => {
          if (existingIds.has(item.id)) {
            return apiRequest(`/moods/${item.id}`, {
              method: "PUT",
              token,
              body: {
                name: item.name,
                color: item.color,
                percent: item.percent,
              },
            });
          }

          return apiRequest("/moods", {
            method: "POST",
            token,
            body: {
              name: item.name,
              color: item.color,
              percent: item.percent,
            },
          });
        })
      );

      await Promise.all(
        items
          .filter((item) => item.id && !nextIds.has(item.id))
          .map((item) =>
            apiRequest(`/moods/${item.id}`, {
              method: "DELETE",
              token,
            })
          )
      );

      const refreshed = await apiRequest("/moods", { token });
      setItems(refreshed);
      setSyncStatus("cloud");
    } catch (error) {
      setAuthError(error.message);
      setSyncStatus("local");
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setAuthError("");
    setSyncStatus("local");
    setEntriesByKey({});
  };

  const upsertEntryState = (entry) => {
    setEntriesByKey((current) => ({
      ...current,
      [entryKey(entry.month, entry.day)]: entry,
    }));
    return entry;
  };

  const saveEntry = async (month, day, payload) => {
    if (!token) {
      throw new Error("Sign in to sync day data.");
    }

    const savedEntry = await apiRequest(`/entries/${month}/${day}`, {
      method: "PUT",
      token,
      body: payload,
    });
    return upsertEntryState(savedEntry);
  };

  const addTask = async (month, day, text) => {
    if (!token) {
      throw new Error("Sign in to sync tasks.");
    }

    // Create optimistic update first for instant UI feedback
    const optimisticId = `temp-${Date.now()}`;
    setEntriesByKey((current) => {
      const currentEntry = current[entryKey(month, day)] ?? {
        month,
        day,
        mood_id: null,
        note: "",
        tasks: [],
      };
      return {
        ...current,
        [entryKey(month, day)]: {
          ...currentEntry,
          tasks: [...(currentEntry.tasks ?? []), { id: optimisticId, text, done: false }],
        },
      };
    });

    try {
      const createdTask = await apiRequest(`/entries/${month}/${day}/tasks`, {
        method: "POST",
        token,
        body: { text },
      });

      // Replace optimistic with real task
      setEntriesByKey((current) => {
        const currentEntry = current[entryKey(month, day)];
        if (!currentEntry) return current;
        return {
          ...current,
          [entryKey(month, day)]: {
            ...currentEntry,
            tasks: currentEntry.tasks.map((task) =>
              task.id === optimisticId ? createdTask : task
            ),
          },
        };
      });
    } catch (error) {
      // Remove optimistic update on error
      setEntriesByKey((current) => {
        const currentEntry = current[entryKey(month, day)];
        if (!currentEntry) return current;
        return {
          ...current,
          [entryKey(month, day)]: {
            ...currentEntry,
            tasks: currentEntry.tasks.filter((task) => task.id !== optimisticId),
          },
        };
      });
      throw error;
    }
  };

  const updateTask = async (month, day, taskId, updates) => {
    if (!token) {
      throw new Error("Sign in to sync tasks.");
    }

    // Optimistic update - modify UI immediately
    let previousValues = {};
    setEntriesByKey((current) => {
      const currentEntry = current[entryKey(month, day)];
      if (!currentEntry) return current;
      
      const taskToUpdate = currentEntry.tasks.find((t) => t.id === taskId);
      if (taskToUpdate) {
        previousValues = { ...taskToUpdate };
      }
      
      return {
        ...current,
        [entryKey(month, day)]: {
          ...currentEntry,
          tasks: currentEntry.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        },
      };
    });

    try {
      const updatedTask = await apiRequest(`/tasks/${taskId}`, {
        method: "PATCH",
        token,
        body: updates,
      });

      // Sync with server response
      setEntriesByKey((current) => {
        const currentEntry = current[entryKey(month, day)];
        if (!currentEntry) return current;
        return {
          ...current,
          [entryKey(month, day)]: {
            ...currentEntry,
            tasks: currentEntry.tasks.map((task) =>
              task.id === taskId ? updatedTask : task
            ),
          },
        };
      });
    } catch (error) {
      // Revert optimistic update on error
      if (Object.keys(previousValues).length > 0) {
        setEntriesByKey((current) => {
          const currentEntry = current[entryKey(month, day)];
          if (!currentEntry) return current;
          return {
            ...current,
            [entryKey(month, day)]: {
              ...currentEntry,
              tasks: currentEntry.tasks.map((task) =>
                task.id === taskId ? previousValues : task
              ),
            },
          };
        });
      }
      throw error;
    }
  };

  const deleteTask = async (month, day, taskId) => {
    if (!token) {
      throw new Error("Sign in to sync tasks.");
    }

    // Store the deleted task in case we need to restore it
    let deletedTask;
    setEntriesByKey((current) => {
      const currentEntry = current[entryKey(month, day)];
      if (!currentEntry) return current;
      deletedTask = currentEntry.tasks.find((t) => t.id === taskId);
      return {
        ...current,
        [entryKey(month, day)]: {
          ...currentEntry,
          tasks: currentEntry.tasks.filter((task) => task.id !== taskId),
        },
      };
    });

    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: "DELETE",
        token,
      });
    } catch (error) {
      // Restore task on error
      if (deletedTask) {
        setEntriesByKey((current) => {
          const currentEntry = current[entryKey(month, day)];
          if (!currentEntry) return current;
          return {
            ...current,
            [entryKey(month, day)]: {
              ...currentEntry,
              tasks: [...currentEntry.tasks, deletedTask],
            },
          };
        });
      }
      throw error;
    }
  };

  return (
    <div>
      <div
        data-theme={aqua ? "aqua" : "my-light-theme"}
        className="font-['Sour Gummy'] min-h-screen "
      >
        <div className="fixed inset-0 pointer-events-none z-0 opacity-50 bg-[linear-gradient(to_right,#ffffff99_1px,transparent_1px),linear-gradient(to_bottom,#ffffff99_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        <div className=" top-0  z-20 mb-6 px-3 pt-3 md:px-6">
          <div className="flex h-16 w-full items-center justify-between rounded-2xl border border-base-content/10 bg-base-100/75 backdrop-blur-sm px-4 py-1  md:px-6">
            <img
              src={logo}
              className={`h-12 md:h-14 w-auto brightness-0 ${aqua ? "invert-[1]" : "invert-[0]"}`}
              alt="Daydex Logo"
            />
            <div className="flex flex-row items-center gap-3">
              <div className="hidden md:block text-xs uppercase tracking-[0.25em] opacity-60">
                {syncStatus === "cloud" ? "Cloud Sync On" : "Local Only"}
              </div>
              <Link to="/blog">
                <button className="btn btn-ghost bg-base-300/70 rounded-xl px-4">
                  Dev logs
                </button>
              </Link>

              <button
                onClick={() => setAqua((prev) => !prev)}
                className="btn btn-ghost bg-base-300/70 rounded-xl p-2"
                aria-label="Toggle theme"
              >
                <SunMoon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-row max-md:flex-col justify-center items-start gap-10 md:gap-20">
          <div className="text-left border-2 border-base-300 bg-base-300/20 rounded-md backdrop-blur-sm">
            <InfoPage
              user={user}
              authReady={authReady}
              authError={authError}
              signInContainerRef={signInContainerRef}
              onLogout={handleLogout}
            />
          </div>
          <div className="h-fit scale-90 md:ml-20">
            <MoodCard items={items} setItems={persistItems} />
          </div>
        </div>

        <div className="flex flex-col mt-10 space-y-10 backdrop-blur-sm">
          <div className="md:ml-20 md:mr-20    bg-base-300/50 rounded-xl shadow-xl pb-4">
            <div className="text-center font-bold text-3xl py-4">Months</div>
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
          </div>
        </div>

        <div className="flex flex-col h-10 border-2 border-base-300 items-center justify-center mt-16 mb-6 gap-4">
          Hope this helps ❤️
        </div>
      </div>
    </div>
  );
};

export default RealPage;
