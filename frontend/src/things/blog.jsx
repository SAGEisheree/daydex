import { Link } from "react-router";


const BlogPage = () => {
  const devLogs = {
    "11/3/2026": ["swapped infocard and moodcard"],
    "9/3/2026": ["started backend"],
    "8/3/2026": ["improved UI"],
    "4/3/2026": ["changed UI"],
    "24/2/2026": [
      "Deleted backend",
      "Revert localstorage syncing to cloud",
      "Revert made the server deployable to vercel",
      "Reapply made the server deployable to vercel",
      "Revert made ready for deploying with render",
      "Revert fixed a small bug in axios js",
      "Revert fixed issues with render",
      "Revert initialised backend",
    ],
    "16/2/2026": [
      "fixed error with render",
      "fixed issues with render",
      "fixed a small bug in axios js",
      "made ready for deploying with render",
      "Revert made the server deployable to vercel",
    ],
    "15/2/2026": [
      "made the server deployable to vercel",
      "localstorage syncing to cloud",
    ],
    "14/2/2026": ["initialised backend"],
    "11/2/2026": ["chnged the display of month cards and added week cards too"],
    "8/2/2026": ["Added total days counter"],
    "5/2/2026": ["Added logo and some UI changes"],
    "2/2/2026 and 3/2/2026": [
      "Color edits now change for colored days too",
      "changed local storage logic and added percentages for moods",
    ],
    "1/2/2026": [
      "Added dark theme",
      "added colors logic to whole site",
      "Updated readme and blog",
    ],
    "31/1/2026": [
      "Fixed run build error with Vercel.",
      "Wrote color changing logic of moods... logic applies only in the card.",
      "Rewritten mood card UI and render logic.",
    ],
    "30/1/2026": [
      "Changed the logic of color selection and added it to new jsx file.",
    ],
    "29/1/2026": [
      "Added development logs UI to blog.",
      "Fixed Vercel hosting issue caused due to wrong routing.",
      "Added Routes for better code readability.",
    ],
    "28/1/2026": [
      "Fixed issue with commits and added comments.",
      "Added note taking feature & changed the popup menu.",
      "Fixed high delay in INP.",
      "Changed the title and optimised a bit by removing unused themes of daisyUI.",
    ],
    "26/1/2026": ["Fist commit to github."],
  };

  return (
    <div className="bg-base-100 m-80 mt-10 max-md:m-8 h-screen">
      <Link to="/">
        <div className="flex flex-row justify-between">
          <h1 className="text-xl md:text-3xl font-bold">Development Logs</h1>
          <button className="btn btn-ghost bg-base-200"> Back </button>
        </div>
      </Link>
      <p>Documenting the journey in making this project</p>
      <div className="h-screen">
        {Object.entries(devLogs).map(([date, logs]) => (
          <div key={date} className="p-2 mt-10 border-l-4 border-base-300">
            <p className="text-xl mb-4">{date}</p>
            <div className="bg-base-200 border border-base-300 p-4 space-y-2">
              {logs.map((log, index) => (
                <p key={index}>• {log}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;