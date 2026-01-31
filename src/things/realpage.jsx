import React from 'react'

import { Link } from "react-router"
import { useState } from 'react'
import Month from './month.jsx'
import BlogPage from './blog.jsx'
import MoodCard from './moodCard.jsx'

const RealPage = () => {


  ///////////   navbar /////////////////////////////////////////
  return (
    <div data-theme="retro" className="font-['Kode Mono'] width-100%">
      
      <div className="h-14 bg-base-300/35 border-b-[1px] border-gray-400 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
        <h1 className=" ml-4 text-3xl max-sm:text-xl font-bold text-center">Mood Metric</h1>
        <Link to="/blog">
          <button
            className="btn btn-outline mr-10 w-24">Blog
          </button>
        </Link>
      </div>

      <div className=" flex md:flex-row  flex-col">
     
        {/* ////////////////////////////  for moods card ///////////////////////////// */}
       <div className="h-fit" >
          <MoodCard />
        </div>
      
        {/* /////////////////////  12 month cards /////////////////// */}
        <div className="h-full">
          <Month />
        </div>
      </div>
    </div >

  )
}

export default RealPage;