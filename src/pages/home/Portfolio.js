import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import roformer_pic from "../../images/sancai-swirl-small.png"
import singularity_pic from "../../images/pink-swirl-small.png"
import jizu_pic from "../../images/mustang-swirl-small.png"
const Portfolio = () => {
    const [show, setShow] = useState(3);

    

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
    
    // set show based on window width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 600) {
                setShow(Math.min(2, portfolio_items.length));
            } else if (window.innerWidth < 900) {
                setShow(Math.min(2, portfolio_items.length));
            } else {
                setShow(Math.min(3, portfolio_items.length));
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [portfolio_items.length]);
    
    const portfolio_divs = portfolio_items.map((item, index) => (
        <div className="portfolio-item" key={index}>
            <div className="portfolio-header-container">
                <img className="portfolio-img" src={item.img.src}
                    alt={item.title}
                    onClick={() => openInNewTab(item.url)}
                    loading="lazy"
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
