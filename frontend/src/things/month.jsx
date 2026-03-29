import { useRef } from "react";
import Day from "./Day";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Month = ({
  items,
  aqua,
  entriesByKey,
  onSaveEntry,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  cloudEnabled,
}) => {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="relative max-md:scale-95 group/scroller">
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-base-100/80 backdrop-blur-sm rounded-full shadow-lg border border-base-content/5 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hover:bg-base-100"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 bg-base-100/80 backdrop-blur-sm rounded-full shadow-lg border border-base-content/5 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hover:bg-base-100"
      >
        <ChevronRight size={24} />
      </button>

      <div
        ref={scrollRef}
        className="flex flex-row overflow-x-auto gap-6 p-4 no-scrollbar [contain:layout_paint]"
      >
        {names.map((name) => (
          <div
            key={name}
            className={`flex-shrink-0 w-80 rounded-2xl p-5 shadow-lg bg-base-200 transition-all duration-300 ${aqua ? "border border-sky-400/20" : "border border-slate-800/5"}`}
          >
            <div className="flex items-center justify-between mb-4 border-b border-base-content/5 pb-2">
              <span className="text-lg font-bold font-heading uppercase tracking-widest">
                {name}
              </span>
              <div className="w-8 h-8 rounded-lg bg-base-300/50 flex items-center justify-center text-[10px] font-bold opacity-40">
                31D
              </div>
            </div>
            <div className="grid grid-cols-7 ">
              {days.map((day) => (
                <Day
                  key={`${name}-${day}`}
                  name={name}
                  day={day}
                  items={items}
                  entry={entriesByKey[`${name}-${day}`]}
                  onSaveEntry={onSaveEntry}
                  onAddTask={onAddTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  cloudEnabled={cloudEnabled}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Month;
