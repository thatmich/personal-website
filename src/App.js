import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import Home from "./pages/Home";
import DocumentMeta from 'react-document-meta';

function App() {
  const meta = {
    title: "Michio Sun",
    description: 'Developer based in Tokyo. Currently attends school at Tsinghua University in Beijing, majoring in Computer Science.',
    canonical: 'http://michiosun.com/',
    meta: {
      charset: 'utf-8',
      name: {
        keywords: 'developer, python, c++, tsinghua, portfolio, michio, sun, michiosun, programmer, quant,'
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
          {/* <Route path="/blog" element={<Blog />} /> */}
        </Routes>
      </main>
      </Router>
    </DocumentMeta>
  );
}

export default App;
