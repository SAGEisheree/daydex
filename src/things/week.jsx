import React, { useState } from 'react';
import Day from './Day';

const Week = ({items,aqua,updateTotal}) => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["1", "2", "3", "4", "5"];

    //   Getting 31 days from day.jsx ////////////////////////////////////////////////////////////////
    return (
        <div className="flex flex-row  overflow-x-auto  justify-start [contain:layout_paint] ">
            {names.map((name) => (
                <div key={name} className={`flex-shrink-0 w-72 xl:w-[230px] xl:h-full h-full pb-4 shadow-md m-4 pt-[4px] bg-base-200 md:h-80 border-t-4 lg:w-80 ${aqua ? 'border-gray-300' : 'border-gray-500'}`}>
                    <div className="text-center font-medium text-m">{name}</div>
                    <div className="grid grid-cols-5 gap-0 mt-2">
                        {days.map((day) => (
                            <Day key={`${name}-${day}`} updateTotal={updateTotal} name={name} day={day} items={items}/>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Week;