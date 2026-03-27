import { Link } from "react-router";
import { SunMoon } from "lucide-react";
import Month from "./month.jsx";
import MoodCard from "./moodCard.jsx";
import useLocalStorage from "../hooks/useLocalStorage.js";
import InfoPage from "./infopage.jsx";
import logo from "../assets/logo.svg";

const RealPage = () => {
  const [items, setItems] = useLocalStorage("mooditems", [
    { id: 1, name: "SuperGood", color: "bg-emerald-500", percent: 0 },
    { id: 2, name: "Good", color: "bg-lime-500", percent: 0 },
    { id: 3, name: "Not Bad", color: "bg-orange-500", percent: 0 },
    { id: 4, name: "Bad", color: "bg-red-500", percent: 0 },
  ]);
  const [aqua, setAqua] = useLocalStorage("aquaState", false);

  return (
    <div>
      <div
        data-theme={aqua ? "aqua" : "my-light-theme"}
        className="font-['Sour Gummy'] min-h-screen "
      >
        <div className="fixed inset-0 pointer-events-none z-0 opacity-50 bg-[linear-gradient(to_right,#ffffff99_1px,transparent_1px),linear-gradient(to_bottom,#ffffff99_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        <div className=" top-0  z-20 mb-6 px-3 pt-3 md:px-6">
          <div className="flex h-16 w-full items-center justify-between rounded-2xl border border-base-content/10 bg-base-100/75 backdrop-blur-sm px-4 py-1  md:px-6">
            <img
              src={logo}
              className={`h-12 md:h-14 w-auto brightness-0 ${aqua ? "invert-[1]" : "invert-[0]"}`}
              alt="Daydex Logo"
            />
            <div className="flex flex-row items-center gap-3">
              <Link to="/blog">
                <button className="btn btn-ghost bg-base-300/70 rounded-xl px-4">
                  Dev logs
                </button>
              </Link>

              <button
                onClick={() => setAqua((prev) => !prev)}
                className="btn btn-ghost bg-base-300/70 rounded-xl p-2"
                aria-label="Toggle theme"
              >
                <SunMoon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-row max-md:flex-col justify-center items-start gap-10 md:gap-20">
          <div className="text-left border-2 border-base-300 bg-base-300/20 rounded-md backdrop-blur-sm">
            <InfoPage />
          </div>
          <div className="h-fit scale-90 md:ml-20">
            <MoodCard items={items} setItems={setItems} />
          </div>
        </div>

        <div className="flex flex-col mt-10 space-y-10 backdrop-blur-sm">
          <div className="md:ml-20 md:mr-20    bg-base-300/50 rounded-xl shadow-xl pb-4">
            <div className="text-center font-bold text-3xl py-4">Months</div>
            <Month items={items} aqua={aqua} />
          </div>
        </div>

        <div className="flex flex-col h-10 border-2 border-base-300 items-center justify-center mt-16 mb-6 gap-4">
          Hope this helps ❤️
        </div>
      </div>
    </div>
  );
};

export default RealPage;
