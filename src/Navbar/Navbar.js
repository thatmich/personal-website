import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Hamburger from 'hamburger-react';
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

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

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className="header">
      <div className="container">
        <nav className="nav__container">
          <div
            className="nav__logo"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#about")
                .scrollIntoView({ behavior: "smooth" });
            }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .querySelector("#about")
                        .scrollIntoView({ behavior: "smooth" });
                      setIsOpen(false);
                    }}
                  >
                    About
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .querySelector("#work")
                        .scrollIntoView({ behavior: "smooth" });
                      setIsOpen(false);
                    }}
                  >
                    Work
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .querySelector("#portfolio")
                        .scrollIntoView({ behavior: "smooth" });
                      setIsOpen(false);
                    }}
                  >
                    Portfolio
                  </div>
                </li>
                <li className="nav__item">
                  <div
                    className="nav__link"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .querySelector("#contact")
                        .scrollIntoView({ behavior: "smooth" });
                      setIsOpen(false);
                    }}
                  >
                    Contact
                  </div>
                </li>
                <li className="nav__item">
                  <NavLink to="/blog" className="nav__link" onClick={() => setIsOpen(false)}>
                    Blog
                  </NavLink>
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
