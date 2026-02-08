import React from 'react'
import { useState } from 'react'

import { Pencil } from 'lucide-react';

const MoodCard = ({ items, setItems, aqua }) => {



  const colors = ["bg-emerald-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-rose-500", "bg-fuchsia-500", "bg-purple-500", "bg-violet-500", "bg-blue-500", "bg-teal-500", "bg-green-500"]

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
      <div className={`h-fit md:w-64 border-t-4 ${aqua ? 'border-gray-300' : 'border-gray-500'} m-4 bg-base-200 shadow-md`} >
        <div className="flex flex-row justify-between pl-4 pr-4">
          <h2 className="text-center text-2xl mt-2 ">Moods</h2>
        </div>

        <div className="flex flex-col m-4  h-fit ">

          {items.map((item) => (
            <div
              key={item.id}
              className={`${item.color} flex pt-3 pl-4 mb-4 h-12 flex-wrap rounded-md justify-between`}>
              <div className={`text-center text-gray-950  font-semibold `}>
                <span className="mr-2">{item.name}</span>
                <span className="pl-4">[{item.percent}%]</span>
              </div>

              <button
                onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                className="pr-3  text-gray-950 pb-3">
                <Pencil size={18} />
              </button>


              {editingId === item.id && (
                <div className="flex flex-wrap z-10 bg-base-300 justify-center border-2 p-2 rounded-md border-gray-500 shadow-md">
                  {colors.map((e) =>
                    <button
                      key={e}
                      onClick={() => {
                        updateItem(item.id, { color: e })
                      }
                      }
                      className={`${e} h-8 w-8 m-1 border-2 border-gray-600 rounded-md`}>
                    </button>)}
                    <button 
                    onClick={()=> setEditingId(null)}
                    className="btn btn-outline">Done</button>
                </div>
              )}


            </div>
          ))}
        </div>
      </div>
    </div>

  )

};
export default MoodCard