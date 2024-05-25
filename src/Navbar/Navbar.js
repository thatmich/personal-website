import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { IoClose, IoMenu } from "react-icons/io5";
import "./Navbar.css";

const Navbar = () => {
 return (
   <header className="header">
     <nav className="nav container">
       <NavLink to="/" className="nav__logo">
         Michio Sun
       </NavLink>

       <div
         className={"nav__menu"}
         id="nav-menu"
       >
         <ul className="nav__list">
           <li className="nav__item">
             <NavLink to="/" className="nav__link">
               Home
             </NavLink>
           </li>
           <li className="nav__item">
             <NavLink to="/portfolio" className="nav__link">
               Portfolio
             </NavLink>
           </li>
           <li className="nav__item">
             <NavLink
               to="/contact"
               className="nav__link"
             >
               Contact me
             </NavLink>
           </li>
         </ul>
         <div className="nav__close" id="nav-close">
           <IoClose />
         </div>
       </div>

       <div className="nav__toggle" id="nav-toggle">
         <IoMenu />
       </div>
     </nav>
   </header>
 );
};

export default Navbar;