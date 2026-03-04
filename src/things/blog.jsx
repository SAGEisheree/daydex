import { Link } from "react-router";


const BlogPage = () => {
  return (
    <div className="bg-base-100 m-80 mt-10 max-md:m-8 h-screen">
      <Link to="/" >
      <div className="flex flex-row justify-between">
        <h1 className="text-xl md:text-3xl font-bold">Development Logs</h1>
        <button 
        className="btn btn-ghost bg-base-200"> Back </button>
      </div>
      </Link>
      <p>Documenting the journey in making this project</p>
      <div className="h-screen">


        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">2/2/2026 and 3/2/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>•Color edits now change for colored days too</p>
            <p>•  changed local storage logic and added percentages for moods</p>
          </div>
        </div>



        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">1/2/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>• Added dark theme</p>
            <p>• added colors logic to whole site </p>
            <p>• Updated readme and blog</p>
          </div>
        </div>




        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">31/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>• Fixed run build error with Vercel.</p>
            <p>• Wrote color changing logic of moods... logic applies only in the card.</p>
            <p>• Rewritten mood card UI and render logic.</p>
          </div>
        </div>

        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">30/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4">
            Changed the logic of color selection and added it to new jsx file.
          </div>
        </div>

        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">29/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>• Added development logs UI to blog.</p>
            <p>• Fixed Vercel hosting issue caused due to wrong routing.</p>
            <p>• Added Routes for better code readability.</p>
          </div>
        </div>

        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">28/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>• Fixed issue with commits and added comments.</p>
            <p>• Added note taking feature & changed the popup menu.</p>
            <p>• Fixed high delay in INP.</p>
            <p>• Changed the title and optimised a bit by removing unused themes of daisyUI.</p>
          </div>
        </div>

        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">26/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4 space-y-2">
            <p>• Fist commit to github.</p>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogPage;