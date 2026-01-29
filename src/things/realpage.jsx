import React from 'react'

import { useState } from 'react'
import Month from './month.jsx'
import BlogPage from './blog.jsx'

const RealPage = () => {
  
     const [blogOpen, setBlogOpened ] = useState(false)
  return (
    <div data-theme="retro"  className="font-['Kode Mono'] width-100%">
      <div className="h-14 bg-base-300/35 border-b-[1px] border-gray-400 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
        <h1 className=" ml-4 text-3xl max-sm:text-xl font-bold text-center">Mood Metric</h1>
        <button 
        onClick={()=>setBlogOpened(true)
        }
        className="btn btn-outline mr-10 w-24">Blog</button>
      </div>

    
     {blogOpen && <link to={`/blog`}/>}

      { blogOpen!=true &&  <div className=" flex md:flex-row  flex-col">
        <div className=" w-screen  ">
          <div className="h-80 md:w-64 border-t-4 border-gray-600 m-4 shadow-md ">
            <h2 className="text-center text-2xl mt-2 ">Moods</h2>
            <div className="flex flex-col m-4  justify-between h-56 ">
              <button className='btn btn-ghost  bg-emerald-500 '>Super Good</button>
              <button className='btn btn-ghost  bg-lime-500 '>Good</button>
              <button className='btn btn-ghost  bg-orange-500 '>Bad</button>
              <button className='btn btn-ghost  bg-rose-500'>Very Bad</button>             
            </div>
          </div>
        </div>
        <div className="h-full">
          <Month />
        </div>

      </div>}

    </div>
    
  )
}

export default RealPage;