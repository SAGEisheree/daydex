import React from 'react'

import { Link } from "react-router"
import { useState, useEffect } from 'react'
import Month from './month.jsx'
import BlogPage from './blog.jsx'
import MoodCard from './moodCard.jsx'

const RealPage = () => {

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('moodItems');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "SuperGood", color: "bg-emerald-500" },
      { id: 2, name: "Good", color: "bg-lime-500" },
      { id: 3, name: "not bad", color: "bg-orange-500" },
      { id: 4, name: "bad", color: "bg-red-500" },
    ];
  });

  useEffect(() => {
    localStorage.setItem('moodItems', JSON.stringify(items));
  }, [items]);

   const [aqua, setAqua] = useState(false)

  ///////////   navbar /////////////////////////////////////////
  return (
    <div data-theme={aqua ? "aqua" : "retro"} className="font-['Kode Mono'] width-100%">

      <div className="h-14 bg-base-300/35 border-b-[1px] border-gray-400 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
        <h1 className=" ml-4 text-3xl max-sm:text-xl font-bold text-center">Mood Metric</h1>
        <div className="flex flex-row ">
          <Link to="/blog">
            <button
              className="btn btn-outline mr-4">Blog
            </button>
          </Link>

          <label 
          onClick={() => {
                    aqua===true ? setAqua(false) : setAqua(true) 
                }}
          className="flex cursor-pointer pt-4 gap-2">
            <span className="label-text">Theme</span>
            <input type="checkbox" value="synthwave" className="toggle theme-controller" />
          </label>

        </div>
      </div>

      <div className=" flex md:flex-row  flex-col">

        {/* ////////////////////////////  for moods card ///////////////////////////// */}
        <div className="h-fit" >
          <MoodCard items={items} setItems={setItems} />
        </div>

        {/* /////////////////////  12 month cards /////////////////// */}
        <div className="h-full">
          <Month items={items} />
        </div>
      </div>
    </div >

  )
}

export default RealPage;