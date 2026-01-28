import React, { useState, useEffect, useRef } from 'react';

/////////////////      logic part ///////////////////////////////////////////////////////////
// To save the color buttons and open popup/////////////////////////////////////////////////////////////////

const Day = ({ name, day }) => {

    const storageKey = `mood-${name}-${day}`;
    const modalRef = useRef(null);

    const [selectedColor, setSelectedColor] = useState(() => {
        const savedColor = localStorage.getItem(storageKey);
        return savedColor || "bg-base-200";
    })

    const pickColor = (colorClass) => {
        setSelectedColor(colorClass);
        localStorage.setItem(storageKey, colorClass);}

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.showModal();
        }
    }, [isOpen]);

    // To save the notes from noteInput //////////////////////////////////////////////////////////////////
    const noteTextKey = `noteText-${name}-${day}`;

    const [noteText, setNoteText] = useState(() => {
        return localStorage.getItem(noteTextKey) || '';
    });
    const handleSave = () => {
        localStorage.setItem(noteTextKey, noteText);
    };

    // Main visual content/////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    return (
        <>
            <button

                id={`btn-${name}-${day}`}
                onClick={() => {
                    setIsOpen(true);
                }}
                className={`btn btn-small text-center text-gray-900/35  ${selectedColor ? selectedColor : 'bg-transparent'}`}
            >
                {day}
            </button>
            {/* /////////////////////////////   popUP  /////////////////////////////////////////////////////// */}

            {isOpen && <dialog
                ref={modalRef}
                onClose={() => setIsOpen(false)}
                id={`modal-${name}-${day}`} className="modal">
                <div className="modal-box h-auto pt-4 pb-0 flex md:w-xl flex-col justify-between">

                    <div className="flex max-sm:flex-wrap  flex-row m-0 justify-between h-fit">
                        <button onClick={() => pickColor('bg-emerald-500')} className='btn btn-ghost  bg-emerald-500 '>Super Good</button>
                        <button onClick={() => pickColor('bg-lime-500')} className='btn btn-ghost  bg-lime-500 '>Good</button>
                        <button onClick={() => pickColor('bg-orange-500')} className='btn btn-ghost  bg-orange-500 '>Bad</button>
                        <button onClick={() => pickColor('bg-rose-500')} className='btn btn-ghost bg-rose-500  '>Very Bad</button>
                        <button onClick={() => pickColor('bg-base-200')} className='btn btn-ghost bg-base-200  '>No Color</button>
                    </div>


                    <div>
                        <div className="flex flex-col max-sm:m-1 m-4 mb-0">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="How was ur day?"
                                className="border-2 border-gray-600 bg-base-100 max-sm:h-32 h-24 w-fill">
                            </textarea>

                            <button
                                onClick={handleSave}
                                className="btn  bg-base-200 btn-small">
                                Add note
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-red-400 btn w-20 m-2 ml-80 max-sm:ml-56 btn-primary z-10">Close</button>

                        </div>
                    </div>


                </div>
            </dialog>}
        </>
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////
};
export default Day;
