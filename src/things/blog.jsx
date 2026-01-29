

const BlogPage = () => {


  return (
    <div className="bg-base-100 m-80 mt-10  max-md:m-8 h-screen ">
      <h1 className="text-xl md:text-3xl font-bold">Development Logs</h1>
      <p> Documeting the journey in making this project</p>
      <div className="  h-screen">
       
       <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">29/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4">
            Added routes for better code readability and also added the  blog you are reading.
          </div>
        </div>
        <div className="p-2 mt-10 border-l-4 border-base-300">
          <p className="text-xl mb-4">28/1/2026</p>
          <div className="bg-base-200 border border-base-300 p-4">
            Changed the UI of popup and also added the note taking feature.
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogPage;