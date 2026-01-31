import React from 'react'
import { useState } from 'react'

import { Pencil, Check } from 'lucide-react';

const MoodCard = () => {

  const [items, setItems] = useState([
    { id: 1, name: "SuperGood", color: "bg-emerald-500" },
    { id: 2, name: "Good", color: "bg-lime-500" },
    { id: 3, name: "not bad", color: "bg-orange-500" },
    { id: 3, name: "bad", color: "bg-red-500" },
  ]);

  const colors = ["bg-emerald-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-pink-500", "bg-rose-500", "bg-fuchsia-500", "bg-purple-500", "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-teal-500", "bg-green-500"]

  const updateItem = (id, updates) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      else {
        return item;
      }
    });
    setItems(newItems);
  };



  const [editingId, setEditingId] = useState(null);

  return (

    <div className=" ">
      <div className="h-fit md:w-64 border-t-4 border-gray-600 m-4 shadow-md ">
        <div className="flex flex-row justify-between pl-4 pr-4">
          <h2 className="text-center text-2xl mt-2 ">Moods</h2>
        </div>

        <div className="flex flex-col m-4  h-fit ">

          {items.map((item) => (
            <div className={`${item.color} flex pt-3 pl-4 mb-4 h-12 flex-row rounded-md justify-between`}>
              <div className={`text-center font-semibold `}>
                {item.name}
              </div>
              <button className="pr-3 pb-3">
                <Pencil size={18} />
              </button>


            </div>


          )
          )}





        </div>
      </div>
    </div>

  )

};
export default MoodCard