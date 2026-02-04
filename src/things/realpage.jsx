import React from 'react'
import { Link } from "react-router"
import { useState, useEffect } from 'react'
import Month from './month.jsx'
import BlogPage from './blog.jsx'
import MoodCard from './moodCard.jsx'
import useLocalStorage from '../hooks/useLocalStorage.js'
import InfoPage from './infopage.jsx'


const RealPage = () => {









  const [items, setItems] = useLocalStorage('mooditems', [
    { id: 1, name: "SuperGood", color: "bg-emerald-500", percent: 0 },
    { id: 2, name: "Good", color: "bg-lime-500", percent: 0 },
    { id: 3, name: "Not Bad", color: "bg-orange-500", percent: 0 },
    { id: 4, name: "Bad", color: "bg-red-500", percent: 0 },
  ]);

  const [aqua, setAqua] = useLocalStorage('aquaState', false);



  ///////////   navbar /////////////////////////////////////////
  return (
    <div data-theme={aqua ? "aqua" : "retro"} className="font-['Kode Mono'] width-100%">

      <div className="h-14 bg-base-300/35 border-b-[1px] border-gray-400 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
        <h1 className=" ml-4 text-3xl max-sm:text-xl font-bold text-center">DayDex</h1>
        <div className="flex flex-row ">
          <Link to="/blog">
            <button
              className="btn btn-ghost bg-base-300/70 mr-4"> Dev log
            </button>
          </Link>

          <label
            onClick={() => {
              aqua === true ? setAqua(false) : setAqua(true)
            }}
            className="flex flex-col cursor-pointer gap-0 mt-2">
            <input type="checkbox" value="synthwave" className="toggle theme-controller" />
            <span className="label-text">Theme</span>

          </label>

        </div>
      </div>
      <div className="text-left">
        <InfoPage />
      </div>
      <div className=" flex md:flex-row  flex-col">

        {/* ////////////////////////////  for moods card ///////////////////////////// */}
        <div className="h-fit " >
          <MoodCard items={items} setItems={setItems} aqua={aqua} />
        </div>

        {/* /////////////////////  12 month cards /////////////////// */}
        <div className=" h-full">



          <Month items={items} aqua={aqua} />
        </div>

      </div>



    </div >

  )
}

export default RealPage;