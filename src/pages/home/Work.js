const Work = () => {
    const timelineItems = [
      {
        company: "Terracotta",
        company_url: "https://www.linkedin.com/company/terracottasec",
        company_url_cn: "https://www.linkedin.com/company/terracottasec",
        role: "Interim CTO",
        date: "Sep 2024 - Jan 2025",
        location: "Hong Kong / Beijing (Hybrid)",
        description: [
          "Led development of a cybersecurity SaaS product from 0 to market, achieving paying customers in 1 month.",
          "Established full-stack infrastructure (React, NodeJS, Python) and optimizing vendor costs.",
          {
            text: "Secured top 10 position (out of 500+) in ",
            link: {
              text: "startup pitch competition",
              url: "https://www.linkedin.com/posts/terracottasec_exciting-news-were-thrilled-to-announce-activity-7257556893345153024-Qw8J?utm_source=share&utm_medium=member_desktop"
            },
            suffix: " and acceptance into ",
            link2: {
              text: "MiraclePlus",
              url: "https://www.miracleplus.com/en/"
            },
            suffix2: " (formerly Y Combinator China)."
          }
        ]
      },
      {
        company: "Meituan",
        company_url: "https://www.meituan.com/en-US/about-us",
        company_url_cn: "https://www.meituan.com",
        role: "Software Engineering (Machine Learning) Intern",
        date: "Jul 2024 - Aug 2024",
        location: "Beijing, China",
        description: [
          "Optimized performance of multiple self-driving car machine learning models by up to 30%.",
          "Enhanced model efficiency using PyTorch's torch.compile and NSight Systems, leading to faster training times and reduced computational cost.",
          "Won Best Intern Team Award for outstanding performance in the internship program."
        ]
      },
      {
        company: "Sparticle",
        company_url: "https://www.sparticle.com/",
        role: "Front-End Development Intern",
        date: "Sep 2021 - Sep 2022",
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
  
      // check link lang
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
                <li className="timeline-item-description" key={index}>
                  {typeof desc === 'string' ? (
                    desc
                  ) : (
                    <>
                      {desc.text}
                      <a className="timeline-item-description-link" href={desc.link.url} target="_blank" rel="noopener noreferrer">
                        {desc.link.text}
                      </a>
                      {desc.suffix}
                      {desc.link2 && (
                        <a className="timeline-item-description-link" href={desc.link2.url} target="_blank" rel="noopener noreferrer">
                          {desc.link2.text}
                        </a>
                      )}
                      {desc.suffix2}
                    </>
                  )}
                </li>
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