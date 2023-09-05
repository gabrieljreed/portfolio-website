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
