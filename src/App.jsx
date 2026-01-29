import { Route, Routes } from "react-router";

import RealPage from "./things/realpage"
import BlogPage from "./things/blog";


const App = () => {
    return (
    <div className="relative h-full w-full">
      <Routes>
        <Route path="/home" element={<RealPage />} />
        <Route path="/blog" element={<BlogPage />} />        
      </Routes>
      </div> 
  );
}

export default App;