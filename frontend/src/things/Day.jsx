import { memo, useCallback, useEffect, useRef, useState } from "react";
import Task from "./task";

const Day = ({ name, day, items, entry, onSaveEntry, onAddTask, onUpdateTask, onDeleteTask, cloudEnabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMoodID, setSelectedMoodID] = useState(entry?.mood_id ?? null);
  const [noteText, setNoteText] = useState(entry?.note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const tasks = entry?.tasks ?? [];

  const activeMood = items.find((item) => item.id === selectedMoodID);
  const displayColor = activeMood ? activeMood.color : "bg-base-200";
  const modalRef = useRef(null);

  useEffect(() => {
    setSelectedMoodID(entry?.mood_id ?? null);
    setNoteText(entry?.note ?? "");
  }, [entry?.mood_id, entry?.note]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [isOpen]);

  const saveEntry = useCallback(async (nextMoodId, nextNote) => {
    if (nextMoodId === (entry?.mood_id ?? null) && nextNote === (entry?.note ?? "")) {
      return;
    }

    if (!cloudEnabled) {
      setSelectedMoodID(nextMoodId);
      setNoteText(nextNote);
      return;
    }

    const previousMoodId = entry?.mood_id ?? null;
    const previousNote = entry?.note ?? "";

    setSelectedMoodID(nextMoodId);
    setNoteText(nextNote);
    setIsSaving(true);
    setSaveError("");
    try {
      const savedEntry = await onSaveEntry(name, Number(day), {
        mood_id: nextMoodId,
        note: nextNote,
      });
      setSelectedMoodID(savedEntry.mood_id ?? null);
      setNoteText(savedEntry.note ?? "");
    } catch (error) {
      setSelectedMoodID(previousMoodId);
      setNoteText(previousNote);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [entry?.mood_id, entry?.note, cloudEnabled, name, day, onSaveEntry]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`btn btn-ghost text-center ${displayColor}`}
      >
        {day}
      </button>

      {isOpen && (
        <dialog
          ref={modalRef}
          onClose={() => setIsOpen(false)}
          id={`modal-${name}-${day}`}
          className="modal"
        >
          <div className="modal-box h-auto max-w-4xl pt-4 pb-4 flex flex-col gap-4">
            <div className="mb-1 text-lg font-semibold">
              {name} {day}
            </div>
            <div className="flex flex-row flex-wrap justify-center gap-2">
              {items.map((item) => {
                const showBorder = selectedMoodID === item.id;

                return (
                  <div
                    key={`${name}-${day}-${item.id}`}
                    className="flex max-:flex-wrap flex-row m-0 justify-between"
                  >
                    <button
                      onClick={() =>
                        void saveEntry(selectedMoodID === item.id ? null : item.id, noteText)
                      }
                      className={`btn btn-ghost w-24 ${showBorder ? "border-2 border-black scale-110" : "border-0"} ${item.color}`}
                    >
                      {item.name}
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => void saveEntry(null, noteText)}
                className="btn btn-ghost bg-base-200 w-24"
              >
                None
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
              <div className="flex flex-col">
                <div className="mb-2 font-semibold">Notes</div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onBlur={() => void saveEntry(selectedMoodID, noteText)}
                  placeholder="How was ur day?"
                  className="min-h-48 w-full rounded-md border-2 border-gray-600 bg-base-100 p-3 md:min-h-72"
                />
                <p className="mt-2 text-xs opacity-60">
                  {cloudEnabled
                    ? saveError || (isSaving ? "Saving to cloud..." : "Saved to cloud")
                    : "Sign in to sync this day to the cloud."}
                </p>
              </div>
              <Task
                tasks={tasks}
                title={`Tasks for ${name} ${day}`}
                onAddTask={(text) => onAddTask(name, Number(day), text)}
                onToggleTask={(taskId, done) => onUpdateTask(name, Number(day), taskId, { done })}
                onDeleteTask={(taskId) => onDeleteTask(name, Number(day), taskId)}
                disabled={!cloudEnabled}
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn bg-base-200 btn-small width-96 mt-3 self-start"
            >
              Done
            </button>
          </div>
        </dialog>
      )}
    </>
  );
};

export default memo(Day);
