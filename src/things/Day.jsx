import React, { useState, useEffect, useRef } from 'react';

const Day = ({ name, day }) => {

    const storageKey = `mood-${name}-${day}`;
    const modalRef = useRef(null);

    const [selectedColor, setSelectedColor] = useState(() => {
        const savedColor = localStorage.getItem(storageKey);
        return savedColor || "bg-base-200";
    })

    const pickColor = (colorClass) => {
        setSelectedColor(colorClass);
        localStorage.setItem(storageKey, colorClass);
        setIsOpen(false);
    }

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.showModal();
        }
    }, [isOpen]);


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

            {isOpen && <dialog
                ref={modalRef}
                onClose={() => setIsOpen(false)}
                id={`modal-${name}-${day}`} className="modal">
                <div className="modal-box h-96 pt-12 flex flex-col justify-between">
                    <div className="h-80 w-64  border-t-4 border-gray-600  shadow-md fixed ">
                        <h2 className="text-center text-2xl mt-2 ">Select a mood</h2>
                        <div className="flex flex-col m-4 justify-between h-56 ">
                            <button onClick={() => pickColor('bg-emerald-500')} className='btn btn-ghost  bg-emerald-500 '>Super Good</button>
                            <button onClick={() => pickColor('bg-lime-500')} className='btn btn-ghost  bg-lime-500 '>Good</button>
                            <button onClick={() => pickColor('bg-orange-500')} className='btn btn-ghost  bg-orange-500 '>Bad</button>
                            <button onClick={() => pickColor('bg-rose-500')} className='btn btn-ghost bg-rose-500  '>Very Bad</button>
                            <button onClick={() => pickColor('bg-base-200')} className='btn btn-ghost  bg-base-300 '>None</button>
                        </div>
                    </div>
                    
                    <div  method="dialog">
                        <button 
                        onClick={() => setIsOpen(false)} 
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </div>
                </div>
            </dialog>}
        </>
    );
};
export default Day;