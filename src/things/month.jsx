import React, { useState } from 'react';
import Day from './Day';

const Month = () => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

   


    return (

        <div className="flex flex-wrap [contain:layout_paint]">


           
            {names.map((name) => (
                <div key={name} className="w-full xl:w-[280px] xl:h-full h-full pb-4 shadow-md m-4 pt-[4px] md:h-80 border-t-4 lg:w-80 border-gray-600">
                    <div className="text-center font-medium text-m">{name}</div>
                    <div className="grid grid-cols-7 gap-0  mt-2">
                        {days.map((day) => (
                            <Day key={`${name}-${day}`} name={name} day={day} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Month;