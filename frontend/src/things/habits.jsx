import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/api.js";

const DailyHabits = ({ token }) => {
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState("");
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const hasMarkedHabits = habits.some((habit) => habit.done);

  useEffect(() => {
    if (!token) {
      setHabits([]);
      setIsLoading(false);
      setError("");
      return;
    }

    let ignore = false;

    const loadHabits = async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest("/habits", { token });
        if (!ignore) {
          setHabits(data);
          setError("");
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadHabits();

    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => {
    if (!copyStatus) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCopyStatus(""), 2000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const addHabit = async () => {
    const trimmedHabit = habitInput.trim();

    if (!token) {
      setError("Sign in to save your daily habits.");
      return;
    }

    if (!trimmedHabit || isSaving) {
      return;
    }

    const duplicateHabit = habits.some(
      (habit) => habit.text.toLowerCase() === trimmedHabit.toLowerCase()
    );
    if (duplicateHabit) {
      return;
    }

    setIsSaving(true);
    try {
      const createdHabit = await apiRequest("/habits", {
        method: "POST",
        token,
        body: { text: trimmedHabit },
      });
      setHabits((current) => [...current, createdHabit]);
      setHabitInput("");
      setError("");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHabit = async (habitId, done) => {
    const previousHabits = habits;
    setHabits((current) =>
      current.map((habit) => (habit.id === habitId ? { ...habit, done } : habit))
    );

    try {
      const updatedHabit = await apiRequest(`/habits/${habitId}`, {
        method: "PATCH",
        token,
        body: { done },
      });
      setHabits((current) =>
        current.map((habit) => (habit.id === habitId ? updatedHabit : habit))
      );
    } catch (updateError) {
      setHabits(previousHabits);
      setError(updateError.message);
    }
  };

  const startEditing = (habit) => {
    setEditingHabitId(habit.id);
    setEditingText(habit.text);
  };

  const cancelEditing = () => {
    setEditingHabitId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    const trimmedText = editingText.trim();
    if (!trimmedText || !editingHabitId || isSaving) {
      return;
    }

    const duplicateHabit = habits.some(
      (habit) =>
        habit.id !== editingHabitId && habit.text.toLowerCase() === trimmedText.toLowerCase()
    );
    if (duplicateHabit) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      const updatedHabit = await apiRequest(`/habits/${editingHabitId}`, {
        method: "PATCH",
        token,
        body: { text: trimmedText },
      });
      setHabits((current) =>
        current.map((habit) => (habit.id === editingHabitId ? updatedHabit : habit))
      );
      cancelEditing();
      setError("");
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHabit = async (habitId) => {
    const previousHabits = habits;
    setHabits((current) => current.filter((habit) => habit.id !== habitId));

    try {
      await apiRequest(`/habits/${habitId}`, {
        method: "DELETE",
        token,
      });
    } catch (deleteError) {
      setHabits(previousHabits);
      setError(deleteError.message);
    }
  };

  const copyAsText = async () => {
    const textToCopy = habits.length > 0
      ? [
          "Daily habits-",
          ...habits.map((habit) => `${habit.done ? ":white_check_mark:" : ":x:"} ${habit.text}`),
        ].join("\n")
      : "Daily habits-\n:x: No habits yet.";

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const unmarkAllHabits = async () => {
    if (!token || isSaving || !hasMarkedHabits) {
      return;
    }

    const previousHabits = habits;
    const habitIdsToClear = habits.filter((habit) => habit.done).map((habit) => habit.id);

    setIsSaving(true);
    setHabits((current) =>
      current.map((habit) => (habit.done ? { ...habit, done: false } : habit))
    );

    try {
      const updatedHabits = await Promise.all(
        habitIdsToClear.map((habitId) =>
          apiRequest(`/habits/${habitId}`, {
            method: "PATCH",
            token,
            body: { done: false },
          })
        )
      );

      const updatedHabitsById = Object.fromEntries(
        updatedHabits.map((habit) => [habit.id, habit])
      );

      setHabits((current) =>
        current.map((habit) => updatedHabitsById[habit.id] ?? habit)
      );
      setError("");
    } catch (updateError) {
      setHabits(previousHabits);
      setError(updateError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="md:ml-20 md:mr-20 rounded-xl border border-base-content/10 bg-base-300/50 p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Daily Habits</h2>
          <p className="text-sm opacity-70">A simple todo list for the habits you want to keep up with.</p>
        </div>
        <div className="text-xs uppercase tracking-[0.25em] opacity-60">
          {token ? "Saved To Cloud" : "Sign In Required"}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={habitInput}
          onChange={(event) => setHabitInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void addHabit();
            }
          }}
          placeholder="Add a daily habit"
          disabled={!token || isSaving}
          className="input input-bordered w-full bg-base-100"
        />
        <button
          onClick={() => void addHabit()}
          disabled={!token || isSaving}
          className="btn rounded-xl bg-base-100 px-5"
        >
          <Plus size={16} />
          {isSaving ? "Saving..." : "Add Habit"}
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-error">{error}</div> : null}

      <div className="mt-5 rounded-2xl border border-base-content/10 bg-base-100/80 p-3">
        {isLoading ? (
          <div className="py-8 text-center text-sm opacity-70">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-70">
            {token ? "No habits added yet." : "Sign in to start saving habits in MongoDB."}
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex flex-col gap-3 rounded-2xl bg-base-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={habit.done}
                    onChange={() => void toggleHabit(habit.id, !habit.done)}
                    disabled={!token}
                    className="checkbox checkbox-sm"
                  />
                  {editingHabitId === habit.id ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void saveEdit();
                        }
                        if (event.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                      className="input input-bordered input-sm w-full bg-base-100"
                    />
                  ) : (
                    <span className={`break-words ${habit.done ? "line-through opacity-50" : ""}`}>
                      {habit.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {editingHabitId === habit.id ? (
                    <>
                      <button
                        onClick={() => void saveEdit()}
                        disabled={isSaving}
                        className="btn btn-ghost btn-sm"
                      >
                        Save
                      </button>
                      <button onClick={cancelEditing} disabled={isSaving} className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(habit)}
                      disabled={!token}
                      className="btn btn-ghost btn-sm"
                    >
                      <Pencil size={15} />
                      
                    </button>
                  )}

                  <button
                    onClick={() => void deleteHabit(habit.id)}
                    disabled={!token || editingHabitId === habit.id}
                    className="btn btn-ghost btn-sm text-error"
                  >
                    <Trash2 size={15} />
                    
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void unmarkAllHabits()}
          disabled={!token || isSaving || !hasMarkedHabits}
          className="btn bg-base-200 btn-small self-start"
        >
          Unmark all
        </button>
        <button
          onClick={() => void copyAsText()}
          className="btn bg-base-200 btn-small self-start"
        >
          Copy as text
        </button>
        {copyStatus ? <p className="text-sm opacity-70">{copyStatus}</p> : null}
      </div>
    </div>
  );
};

export default DailyHabits;
