import React from 'react'
import { useState } from 'react'

const MoodCard = () => {


  const moodColors = ["bg-emerald-500", "bg-lime-500", "bg-orange-500", "bg-rose-500"];
  const [isOpenMood, setIsOpenMood] = useState("false")
  const moodNums = ["1", "2", "3", "4"];
  const moodNames = ["Super Good", "Good", "Bad", "Very Bad"];
  const allColors = ["bg-emerald-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-pink-500", "bg-rose-500", "bg-fuchsia-500", "bg-purple-500", "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-green-500"]
    function changeColor() {

    }


  return (
    
        <div className=" ">
          <div className="h-fit md:w-64 border-t-4 border-gray-600 m-4 shadow-md ">
            <div className="flex flex-row justify-between pl-4 pr-4">
              <h2 className="text-center text-2xl mt-2 ">Moods</h2>
            </div>
            <div className="flex flex-col m-4  h-56 ">

              {!isOpenMood && <> <div
                className="flex mt-2 flex-wrap gap-2">
                {allColors.map((color) => (
                  <div key={color} className={`flex flex-row  justify-between ${color} w-6`}>
                    <div
                      onClick={() => changeColor()}
                      className={` h-6 p-2 flex flex-wrap`}>
                    </div>
                  </div>
                ))}
              </div></>}


               {moodNums.map((num, index) => (

                <div className={`flex flex-row justify-between ${moodColors[index]}`}>
                <div
                  className={` h-10 p-2 font-semibold `}>
                  {moodNames[index]}
                </div>
                <button
                  onClick={() => setIsOpenMood(!isOpenMood)}
                  className="btn btn-sm border-2 border-black m-1 bg-transparent">Change</button>
              </div>
               ))}
            </div>
          </div>
        </div>
  )
}

export default MoodCard