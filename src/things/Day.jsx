import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

export const totalMoods = 0


const Day = ({ name, day, items, updateTotal }) => {
    // local storage logic ////////////////////////////////////////////////////////////////////////
    const storageKey = `mood-${name}-${day}`;
    const noteTextKey = `noteText-${name}-${day}`;

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
                    <div className="modal-box h-auto pt-4 pb-0 flex md:w-xl flex-col justify-between">
                        <div className="mb-3">{name}  {day}</div>
                        <div className="flex flex-row flex-wrap justify-center">
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
                            className='btn btn-ghost bg-base-200'
                            >
                            None
                        </button>
                    </div>

                    <div>
                        <div className="flex flex-col max-sm:m-1 m-4 mb-0">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="How was ur day?"
                                className="border-2 border-gray-600 bg-base-100 max-sm:h-48 h-64 w-fill"
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn bg-base-200 btn-small mt-2"
                            >
                                Done
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-red-400 btn w-20 m-2 ml-80 max-sm:ml-56 btn-primary z-10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                </dialog >
            )}
        </>
    );
};

export default Day;