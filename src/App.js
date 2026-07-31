import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import Home from "./views/Home";
import DocumentMeta from 'react-document-meta';

function App() {
  const meta = {
    title: "Michio Sun",
    description: "I'm a machine learning engineer based in Tokyo. I am generally interested in research and applications of AI for robotics, deep reinforcement learning, and multimodal models.",
    canonical: 'http://michiosun.com/',
    meta: {
      charset: 'utf-8',
      name: {
        keywords: 'developer, python, c++, tsinghua, portfolio, michio, sun, michiosun, programmer, robotics, vla, models, RL, reinforcement'
      }
    }
  };
  return (
    <DocumentMeta {...meta}>
      <Router>
        <Navbar />
        <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
      </Router>
    </DocumentMeta>
  );
}

export default App;
