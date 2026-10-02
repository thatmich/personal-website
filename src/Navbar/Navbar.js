import React, { useState, useEffect } from "react";
import Hamburger from 'hamburger-react';
import "./Navbar.css";

const Navbar = () => {
  // The page is prerendered with no window, so start from the desktop layout
  // (links in the HTML) and measure the real width once mounted.
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [measured, setMeasured] = useState(false);
  const accentColor = () => getComputedStyle(document.documentElement).getPropertyValue('--first-color');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleResize = () => {
    if (window.innerWidth >= 850) {
      setIsOpen(true);
      setIsMobile(false);
    }
    else {
      setIsOpen(false);
      setIsMobile(true);
    }
  };

  const nav_link_click = (e, id) => {
    e.preventDefault();
    // color and expand the link
    e.target.style.color = accentColor();
    e.target.style.transform = "scale(1.1)";
    e.target.style.transition = "color 0.1s, transform 0.1s";
    setTimeout(() => {
      e.target.style.color = "";
      e.target.style.transform = "";
      document.querySelector(id).scrollIntoView({ behavior: "smooth" });
      if (isMobile)
        setIsOpen(false);
      else
        setIsOpen(true);
    }, 100);
  };

  const blog_click = (e) => {
    // color and expand the link
    e.target.style.color = accentColor();
    e.target.style.transform = "scale(1.1)";
    e.target.style.transition = "color 0.1s, transform 0.1s";
    setTimeout(() => {
      e.target.style.color = "";
      e.target.style.transform = "";
      if (isMobile)
        setIsOpen(false);
      else
        setIsOpen(true);
    }, 100);
  };

  useEffect(() => {
    handleResize();
    setMeasured(true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className={measured ? "header" : "header header--unmeasured"}>
      <div className="container">
        <nav className="nav__container">
          <div
            className="nav__logo"
            onClick={(e) => nav_link_click(e, "#about")}
          >
            Michio Sun
          </div>
          {isMobile && (
            <div className="nav-hamburger">
              <Hamburger toggled={isOpen} toggle={toggleMenu} />
            </div>
          )}
          {isOpen && (
            <div className={`nav__menu`} id="nav-menu">
              <ul className="nav__list">
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick= {(e) => nav_link_click(e, "#about")}
                  >
                    About
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => nav_link_click(e, "#work")}
                  >
                    Work
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => nav_link_click(e, "#portfolio")}
                  >
                    Portfolio
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => nav_link_click(e, "#contact")}
                  >
                    Contact
                  </div>
                </li>
                <li className="nav__item">
                  <a href="/blog" className="nav__link" onClick={blog_click}>
                    Blog
                  </a>
                </li>
                {isMobile && (
                  // close button
                  <li className="nav__item">
                    <div
                      className="nav__link"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="close-button">
                        {/* close icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon icon-tabler icon-tabler-x"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" />
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>

                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
