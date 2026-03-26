import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Task from './task';

export const totalMoods = 0


const Day = ({ name, day, items, updateTotal }) => {
    // local storage logic ////////////////////////////////////////////////////////////////////////
    const storageKey = `mood-${name}-${day}`;
    const noteTextKey = `noteText-${name}-${day}`;
    const taskStorageKey = `tasks-${name}-${day}`;

    const [isOpen, setIsOpen] = useState(false);
    const [selectedMoodID, setSelectedMoodID] = useLocalStorage(storageKey, null);
    const [noteText, setNoteText] = useLocalStorage(noteTextKey, '');


    const activeMood = items.find(item => item.id === selectedMoodID);
    const displayColor = activeMood ? activeMood.color : "bg-base-200";
    // Modal popup logic /////////////////////////////////////////////////////////////////////////
    const modalRef = useRef(null);
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.showModal();
        }
    }, [isOpen]);

    /////     visual elements ///////////////////////////////////////////////////////////////////////   
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`btn btn-ghost text-center ${displayColor}`}
            >
                {day}
            </button>

            {/* //////// popup ////////////////////////////////////////////////////////////////////////////////// */}

            {isOpen && (
                <dialog
                    ref={modalRef}
                    onClose={() => setIsOpen(false)}
                    id={`modal-${name}-${day}`}
                    className="modal"
                >
                    <div className="modal-box h-auto max-w-4xl pt-4 pb-4 flex flex-col gap-4">
                        <div className="mb-1 text-lg font-semibold">{name} {day}</div>
                        <div className="flex flex-row flex-wrap justify-center gap-2">
                            {items.map((item) => {

                                const showBorder = selectedMoodID === item.id;
                                return (
                                    <div key={`${name}-${day}-${item.id}`} className="flex max-:flex-wrap flex-row m-0 justify-between">
                                        <button
                                            onClick={() => {
                                                setSelectedMoodID(item.id)
                                                if (selectedMoodID === item.id) {
                                                    setSelectedMoodID(null);
                                                    updateTotal(-1);
                                                } else {
                                                    if (!selectedMoodID) {
                                                        updateTotal(1);
                                                    }
                                                    setSelectedMoodID(item.id);
                                                }
                                            }}
                                            className={`btn btn-ghost w-24 ${showBorder ? 'border-2 border-black scale-110' : 'border-0'} ${item.color}`}
                                        >
                                            {item.name}
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => {

                                    if (selectedMoodID !== null) updateTotal(-1);
                                    setSelectedMoodID(null);
                                }}
                            className='btn btn-ghost bg-base-200 w-24'
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
                                placeholder="How was ur day?"
                                className="min-h-48 w-full rounded-md border-2 border-gray-600 bg-base-100 p-3 md:min-h-72"
                            />
                        </div>
                        <Task storageKey={taskStorageKey} title={`Tasks for ${name} ${day}`} />
                    </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn bg-base-200 btn-small width-96 mt-3 self-start"
                            >
                                Done
                            </button>
                </div>
                </dialog >
            )}
        </>
    );
};

export default Day;
