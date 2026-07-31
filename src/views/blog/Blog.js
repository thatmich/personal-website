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

const blogPosts = [
    {
        title: "Test Post: Hello, World",
        date: "Jul 31, 2026",
        tags: ["meta", "test"],
        content: [
            "This is a test entry to preview the blog layout. It uses the same card styling as the work experience section on the home page, so the two pages feel consistent.",
            "A post is just an object in the blogPosts array: a title, a date, some tags, and paragraphs of content. Delete this entry and add a real one whenever you're ready to write."
        ]
    }
];

const Blog = () => {
    return (
    <div>
        <BlogNavbar/>
        <div className="Blog container">
            <h2 className="section-title">Blog</h2>
            <div className="blog-posts">
                {blogPosts.map((post, index) => (
                    <article className="blog-post" key={index}>
                        <div className="blog-post-header">
                            <h3 className="blog-post-title">{post.title}</h3>
                            <span className="blog-post-date">{post.date}</span>
                        </div>
                        {post.tags && (
                            <div className="blog-post-tags">
                                {post.tags.map((tag, tagIndex) => (
                                    <span className="blog-post-tag" key={tagIndex}>{tag}</span>
                                ))}
                            </div>
                        )}
                        {post.content.map((paragraph, pIndex) => (
                            <p className="blog-post-paragraph" key={pIndex}>{paragraph}</p>
                        ))}
                    </article>
                ))}
            </div>
        </div>
    </div>
    );
}

export default Blog;
