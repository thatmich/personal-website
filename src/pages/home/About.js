// import about_pic from "../../websitepic.jpg"
import about_pic from "../../images/websitepic.jpg"

const About = () => {
    return (
        <section className="About container">
            <div className="SelfDescription">
                <h1>Michio Sun</h1>
                <p>
                I am a developer based in Tokyo, Japan, currently attending school at Tsinghua University in Beijing, China, majoring in Computer Science.
                <br />
                Interested in machine learning optimizations and security.
                <br />
                <span style={{fontWeight: "bold"}}>
                    Currently looking for work! Feel free to contact me!
                </span>
                </p>
            </div>
            
            <div className="about_pic">
                <img src={about_pic} alt="me" id="profile_pic"/>
            </div>
        </section>
    );
}

export default About;