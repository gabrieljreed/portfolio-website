import { Route, Routes } from "react-router-dom";
import './App.css'

import Home from "./pages/HomePage";
import About from "./pages/AboutPage";
import Contact from "./pages/ContactPage";
import Projects from "./pages/ProjectsPage";
import Navbar from "./pages/Navbar";

function App() {

  return (
    <>
      <Navbar />
{/* <nav className="flex justify-between items-center relative bg-black py-3 lg:px-12 px-6 text-white w-11/12 mx-auto">
  <input type="checkbox" id="Navbar-1-checkbox" className="hidden peer">
  </input>
    <div className="w-16 h-16 basis-16 rounded-full bg-white text-black font-bold flex items-center justify-center">
      Logo
    </div>
    <ul className="lg:flex lg:translate-x-0 lg:peer-checked:static absolute lg:static -translate-x-[100vh] lg:basis-3/5 justify-evenly font-extrabold peer-checked:translate-x-0 top-[88px] transition-transform duration-500 left-0 right-0  bg-black lg:bg-transparent">
      <li><span className="p-6 cursor-pointer flex lg:p-0 lg:hover:bg-inherit hover:bg-gray-500 transition-colors duration-700 ease-in">About</span></li>
      <li><span className="p-6 cursor-pointer flex lg:p-0 lg:hover:bg-inherit hover:bg-gray-500 transition-colors duration-700 ease-in">Career</span></li>
      <li><span className="p-6 cursor-pointer flex lg:p-0 lg:hover:bg-inherit hover:bg-gray-500 transition-colors duration-700 ease-in">Events</span></li>
      <li><span className="p-6 cursor-pointer flex lg:p-0 lg:hover:bg-inherit hover:bg-gray-500 transition-colors duration-700 ease-in">Product</span></li>
    </ul>
    <label htmlFor="Navbar-1-checkbox" className="lg:hidden w-10 h-1 relative rounded-full bg-white after:w-10 after:h-1 after:rounded-full after:bg-white before:w-10 before:h-1 before:rounded-full before:bg-white after:absolute after:top-2 before:-top-2 before:absolute cursor-pointer peer-checked:before:top-0 peer-checked:after:top-0 peer-checked:after:rotate-45 peer-checked:before:-rotate-45  after:transition-transform after:duration-500 before:transition-transform before:duration-500 ease-in peer-checked:bg-transparent">
    </label>
</nav> */}
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />

      </Routes>
    </>
  )
}

export default App
