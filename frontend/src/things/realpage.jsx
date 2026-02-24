import React from 'react'
import { Link } from "react-router"
import { useState, useEffect } from 'react'
import Month from './month.jsx'
import BlogPage from './blog.jsx'
import MoodCard from './moodCard.jsx'
import useLocalStorage from '../hooks/useLocalStorage.js'
import InfoPage from './infopage.jsx'
import logo from '../assets/logo.svg';
import Week from './week.jsx'

const RealPage = () => {
  const [items, setItems] = useLocalStorage('mooditems', [
    { id: 1, name: "SuperGood", color: "bg-emerald-500", percent: 0 },
    { id: 2, name: "Good", color: "bg-lime-500", percent: 0 },
    { id: 3, name: "Not Bad", color: "bg-orange-500", percent: 0 },
    { id: 4, name: "Bad", color: "bg-red-500", percent: 0 },
  ]);


  const [totalMoods, setTotalMoods] = useLocalStorage('totalcount', 0)
  const updateTotal = (amount) => {
    setTotalMoods(prev => prev + amount);
  };



  const [aqua, setAqua] = useLocalStorage('aquaState', false);

  ///////////   navbar /////////////////////////////////////////
  return (
    <>



      <div
      // className="min-h-screen bg-cover bg-center bg-no-repeat   bg-fixed"
      // style={{ backgroundImage: `url(${backgroundImage})` }}
      >

        {/* bg-black/20 */}
        <div data-theme={aqua ? "aqua" : "retro"} className="font-['Sour Gummy'] min-h-screen ">

          <div className="h-14 bg-base-300/35 border-b-[1px] border-gray-400 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
            <img
              src={logo}
              className={`h-20 mt-2 w-auto brightness-0  ${aqua ? 'invert-[1]' : 'invert-[0] '} `}
              alt="Daydex Logo"
            />
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

          <div className="flex flex-row max-md:flex-col ">

            <div className=" h-fit " >
              <MoodCard items={items} setItems={setItems} aqua={aqua} />
            </div>

            <div className="text-left">
              <InfoPage />
            </div>
          </div>

          {/* <button className="">Total days selected = {totalMoods}</button> */}



          <div className=" flex md:flex-row mt-10 md:p-10 flex-col">

            {/* ////////////////////////////  for moods card ///////////////////////////// */}


            <div className="flex flex-col">
              {/* /////////////////////  12 month cards /////////////////// */}
              <div className=" border-t-4 md:ml-20 md:w-[90vw] border-gray-500 bg-base-300 h-full ">


               <div className="text-center font-bold text-3xl">Months</div>
                <Month items={items} updateTotal={updateTotal} aqua={aqua} />
              </div>

              {/* /////////////////////  week cards /////////////////// */}

              <div className=" border-t-4 mt-10  md:w-[90vw] md:ml-20 mb-16 border-gray-500 bg-base-300 h-full ">


               <div className="text-center font-bold text-3xl">Weeks</div>

                <Week items={items} updateTotal={updateTotal} aqua={aqua} />
              </div>
            </div>
          </div>



        </div >
      </div>
    </>
  )
}

export default RealPage;