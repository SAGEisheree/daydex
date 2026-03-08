import React from 'react'
import { Link } from "react-router"
import { useState, useEffect } from 'react'
import { SunMoon } from 'lucide-react'
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
        <div data-theme={aqua ? "aqua" : "my-light-theme"} className="font-['Sour Gummy'] min-h-screen ">

          <div className="h-14 px-10 pt-6 mb-6 z-10 sticky backdrop-blur-[7px] top-0 w-full flex items-center justify-between">
            <img
              src={logo}
              className={`h-20 mt-2 w-auto brightness-0  ${aqua ? 'invert-[1]' : 'invert-[0] '} `}
              alt="Daydex Logo"
            />
            <div className="flex flex-row items-center mr-4">
              <Link to="/blog">
                <button
                  className="btn btn-ghost bg-base-300/70 mr-4"
                >
                  Dev logs
                </button>
              </Link>

              <button
                onClick={() => setAqua(prev => !prev)}
                className="btn btn-ghost bg-base-300/70 p-2"
                aria-label="Toggle theme"
              >
                <SunMoon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-row max-md:flex-col ">

            <div className="h-fit md:ml-20">
              <MoodCard items={items} setItems={setItems} aqua={aqua} />
            </div>

            <div className="text-left">
              <InfoPage />
            </div>
          </div>

          {/* <button className="">Total days selected = {totalMoods}</button> */}



          <div className="flex flex-col mt-10 space-y-10">
            {/* /////////////////////  12 month cards /////////////////// */}
            <div className="md:ml-20 md:mr-20 bg-base-300 rounded-2xl shadow-xl pb-4">
              <div className="text-center font-bold text-3xl py-4">Months</div>
              <Month items={items} updateTotal={updateTotal} aqua={aqua} />
            </div>

            {/* /////////////////////  week cards /////////////////// */}
            <div className="md:ml-20 md:mr-20 mb-16 bg-base-300 rounded-2xl shadow-xl pb-4">
              <div className="text-center font-bold text-3xl py-4">Weeks</div>
              <Week items={items} updateTotal={updateTotal} aqua={aqua} />
            </div>
          </div>



        </div >
      </div>
    </>
  )
}

export default RealPage;