import React, { useState } from 'react';
import Day from './Day';

const Month = ({items,aqua,updateTotal}) => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

    //   Getting 31 days from day.jsx ////////////////////////////////////////////////////////////////
    return (
        <div className="flex flex-wrap justify-evenly [contain:layout_paint]">
            {names.map((name) => (
                <div key={name} className={`w-full xl:w-[280px] xl:h-full h-full pb-4 shadow-md m-4 pt-[4px] bg-base-200 md:h-80 border-t-4 lg:w-80 ${aqua ? 'border-gray-300' : 'border-gray-500'}`}>
                    <div className="text-center font-medium text-m">{name}</div>
                    <div className="grid grid-cols-7 gap-0  mt-2">
                        {days.map((day) => (
                            <Day key={`${name}-${day}`} updateTotal={updateTotal} name={name} day={day} items={items}/>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Month;