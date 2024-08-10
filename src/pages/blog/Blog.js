import React from "react";
import { NavLink } from "react-router-dom";
import "../../Navbar/Navbar.css";
import "./Blog.css";

const BlogNavbar = () => {
    return (
    <header className="header">
        <div className="container">
        <nav className="nav__container">
        <NavLink
            to="/"
            className="nav__logo"
            >
            Michio Sun
        </NavLink>
        </nav>
    </div>
    </header>
    );
}

const Blog = () => {
    return (
    <div>
        <BlogNavbar/>
        <div className="Blog container">
            <h2 className="section-title">Blog</h2>
            <p>Coming soon!</p>
        </div>
    </div>
    );
}

export default Blog;