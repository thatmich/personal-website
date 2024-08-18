const Work = () => {
    const timelineItems = [
        {
            company: "Meituan",
            company_url: "https://www.meituan.com/en-US/about-us",
            company_url_cn: "https://www.meituan.com",
            role: "Software Engineering (Machine Learning) Intern",
            date: "2024 - Current",
            location: "Beijing, China",
            description: [
                "Optimized performance of multiple self-driving car machine learning models by up to 30%",
                "Enhanced model efficiency using PyTorch's torch.compile and NSight Systems, leading to faster training times and reduced computational cost.",
                "Won Best Intern Team Award for outstanding performance in the internship program."
            ]
        },
        {
            company: "Sparticle",
            company_url: "https://www.sparticle.com/",
            role: "Front-End Development Intern",
            date: "2021 - 2022",
            location: "Tokyo, Japan",
            description: [
                "Developed the front-end of a B2B web-based chat application using React in a multinational startup team.",
                "Led the English localization of Felo, a comprehensive workspace suite, translating over 2,000 phrases to enhance user accessibility."
            ]
        }
    ];

    const totalItems = timelineItems.length;

    let timelineItemsDivs = timelineItems.map((item, index) => {
        let itemClassName = "timeline-item";
        if (index === 0) {
            itemClassName += " timeline-item-first";
        } else if (index === totalItems - 1) {
            itemClassName += " timeline-item-last";
        }
        
        // check link language
        if (item.company_url_cn) {
            if (navigator.language === "zh-CN") {
                item.company_url = item.company_url_cn;
            }
        }
        else if (item.company_url_jp) {
            if (navigator.language === "ja-JP") {
                item.company_url = item.company_url_jp;
            }
        }
    
        return (
            <div className={itemClassName} key={index}>
                <div className="timeline-item-left">
                    <h3 className="timeline-item-company" onClick={() => window.open(item.company_url, "_blank")}>{item.company}</h3>
                    <span>{item.date}</span>
                    <div className="timeline-item-location">{item.location}</div>
                </div>
                <div className="timeline-item-right">
                    <h4>{item.role}</h4>
                    <ul>
                        {item.description.map((desc, index) => (
                            <li className="timeline-item-description" key={index}>{desc}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    });

    return (
        <section className="Work container">
            <h2 className="work-title">Work Experience</h2>
            <div className="work-description">
                {timelineItemsDivs}
            </div>
        </section>
    );
}

export default Work;