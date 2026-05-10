import { useState, useCallback } from "react";

const Task = ({
  tasks,
  title,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  disabled,
}) => {
  const [taskInput, setTaskInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const addTask = useCallback(async () => {
    const trimmedTask = taskInput.trim();

    if (!trimmedTask || isAdding) return;

    const taskAlreadyExists = tasks.some(
      (task) => task.text.toLowerCase() === trimmedTask.toLowerCase()
    );

    if (taskAlreadyExists) return;

    setIsAdding(true);
    try {
      await onAddTask(trimmedTask);
      setTaskInput("");
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAdding(false);
    }
  }, [taskInput, isAdding, tasks, onAddTask]);

  const startEditing = useCallback((task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
    setEditingText("");
    setIsEditing(false);
  }, []);

  const saveEditedTask = useCallback(async () => {
    const trimmedTask = editingText.trim();

    if (!editingTaskId || !trimmedTask || isEditing) return;

    const currentTask = tasks.find((task) => task.id === editingTaskId);
    if (!currentTask) {
      cancelEditing();
      return;
    }

    const duplicateTask = tasks.some(
      (task) =>
        task.id !== editingTaskId && task.text.toLowerCase() === trimmedTask.toLowerCase()
    );

    if (duplicateTask || trimmedTask === currentTask.text) {
      cancelEditing();
      return;
    }

    setIsEditing(true);
    try {
      await onEditTask(editingTaskId, trimmedTask);
      cancelEditing();
    } catch (error) {
      console.error("Failed to edit task:", error);
    } finally {
      setIsEditing(false);
    }
  }, [editingText, editingTaskId, isEditing, tasks, onEditTask, cancelEditing]);

  return (
    <div className="flex flex-col max-sm:m-1 m-4 mb-0 min-w-64 flex-1">
      <div className="mb-2 font-semibold">{title}</div>

      <div className="flex gap-2">
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isAdding) {
              void addTask();
            }
          }}
          placeholder="Add a task"
          disabled={disabled || isAdding}
          className="input input-bordered w-full bg-base-100"
        />
        <button onClick={() => void addTask()} disabled={disabled || isAdding} className="btn bg-base-200">
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-base-300 bg-base-100 p-2">
        {tasks.length === 0 ? (
          <p className="text-sm opacity-60">No tasks for this day yet.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="mb-2 flex items-center justify-between rounded-md bg-base-200 px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(task.id, !task.done)}
                  disabled={disabled || isEditing}
                  className="checkbox checkbox-sm"
                />
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void saveEditedTask();
                      }
                      if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    disabled={disabled || isEditing}
                    className="input input-bordered input-sm w-full bg-base-100"
                  />
                ) : (
                  <span className={`break-words ${task.done ? "line-through opacity-60" : ""}`}>
                    {task.text}
                  </span>
                )}
              </div>
              <div className="ml-3 flex items-center gap-1">
                {editingTaskId === task.id ? (
                  <>
                    <button
                      onClick={() => void saveEditedTask()}
                      disabled={disabled || isEditing}
                      className="btn btn-ghost btn-xs"
                    >
                      {isEditing ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={disabled || isEditing}
                      className="btn btn-ghost btn-xs"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEditing(task)}
                    disabled={disabled}
                    className="btn btn-ghost btn-xs"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => onDeleteTask(task.id)}
                  disabled={disabled || editingTaskId === task.id}
                  className="btn btn-ghost btn-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Task;
