// import about_pic from "../../websitepic.jpg"
import about_pic from "../../images/websitepic.jpg"

const About = () => {
    return (
        <section className="About container">
            <div className="SelfDescription">
                <h1>Michio Sun</h1>
                <p>
                Michio Sun (孙迪往) is a developer based in Tokyo, Japan. 
                He currently attends school at Tsinghua University in Beijing, China, majoring in Computer Science.
                <br />
                He is interested in machine learning and fintech.
                </p>
            </div>
            
            <div className="about_pic">
                <img src={about_pic} alt="me" id="profile_pic"/>
            </div>
        </section>
    );
}

export default About;