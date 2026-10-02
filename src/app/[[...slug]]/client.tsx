'use client'

import '../../App.css'
import Navbar from '../../Navbar/Navbar'
import Home from '../../views/Home'

/* Prerendered at build time, so the bio, work history and projects are in the HTML. */
export function HomePage() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Home />
      </main>
    </>
  )
}
