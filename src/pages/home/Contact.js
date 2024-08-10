import React from "react";
// linkedin and github logos
import { FaLinkedin, FaGithub } from "react-icons/fa";
// strava logo
import { FaStrava } from "react-icons/fa";

const Contact = () => {
    return (
        <div className="Contact container">
            <h2 className="section-title">Contact</h2>
            <p>Let's get in touch!</p>
            <p>sun-dw21(at)mails.tsinghua.edu.cn</p>
            <div className="contact-links">
                <a className="contact-link-item" href="https://www.linkedin.com/in/michiosun/" target="_blank" rel="noreferrer">
                    <FaLinkedin />
                </a>
                <a className="contact-link-item" href="https://github.com/thatmich" target="_blank" rel="noreferrer">
                    <FaGithub />
                </a>
                <a className="contact-link-item" href="https://www.strava.com/athletes/99480116" target="_blank" rel="noreferrer">
                    <FaStrava />
                </a>
            </div>
        </div>
    );
}

export default Contact;