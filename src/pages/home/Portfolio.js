import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import roformer_pic from "../../images/sancai-swirl.png"
import singularity_pic from "../../images/pink-swirl.png"
import jizu_pic from "../../images/mustang-swirl.png"
const Portfolio = () => {
    const [show, setShow] = useState(3);

    // set show based on window width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 600) {
                setShow(2);
            } else if (window.innerWidth < 900) {
                setShow(2);
            } else {
                setShow(3);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    

    function openInNewTab(url) {
        var win = window.open(url, '_blank');
        win.focus();
    }
    
    const portfolio_items = [
        { 
            title: "Jittor RoFormer",
            title_color: "rgb(230, 230, 230)",
            img: roformer_pic,
            description: "Recreated RoFormer (Transformer with Rotary Position Embedding) in Jittor, a JIT deep learning framework in Python.",
            url: "https://github.com/julianabanos/roformer_jittor_ann_2023",
        },
        {
            title: "Five-Stage Pipeline CPU",
            title_color: "rgb(230, 230, 230)",
            img: jizu_pic,
            description: "Designed and implemented a five-stage pipelined RISC-V CPU in SystemVerilog, supporting RV32I instructions, memory-mapped I/O, serial communication, and interrupt handling.",
            url: "https://github.com/thatmich/5stage-pipeline-50m/tree/main"
        },
        {
            title: "Singularity EAM",
            title_color: "rgb(230, 230, 230)",
            img: singularity_pic,
            description: "Enterprise Asset Management (EAM) software developed in PHP, MySQL, and JavaScript for Singularity, a student-led software development team.",
            url: "https://byrvr.notion.site/Singularity-EAM-Documentation-655d01e58fbe4d06b846b497d018f8d5"
        },
    ];
    
    const portfolio_divs = portfolio_items.map((item, index) => (
        <div className="portfolio-item" key={index}>
            <div className="portfolio-header-container">
                <img className="portfolio-img" src={item.img}
                    alt={item.title}
                    onClick={() => openInNewTab(item.url)}
                />
                <div className="portfolio-text" style={{color: item.title_color}}>
                    {item.title}
                </div>
            </div>
            <div className="portfolio-description">{item.description}</div>
        </div>
    ));

    return (
    <section className="Portfolio container">
        <Carousel show={show}>
            {portfolio_divs}
        </Carousel>
    </section>
    );
}


export default Portfolio;