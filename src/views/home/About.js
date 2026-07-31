// import about_pic from "../../websitepic.jpg"
import about_pic from "../../images/websitepic.jpg"

const About = () => {
    return (
        <section className="About container">
            <div className="SelfDescription">
                <h1>Michio Sun</h1>
                <p>
                Hi! I'm a machine learning engineer based in Tokyo. I am generally interested in research and applications of AI for robotics, deep reinforcement learning, and ML optimizations.
                <br />
                Previously CS @ Tsinghua University in Beijing.
                <br />
                I am passionate about pushing the frontier of robotics. In my spare time, I enjoy running and making coffee.
                </p>
            </div>
            
            <div className="about_pic">
                <img src={about_pic.src} alt="me" id="profile_pic"/>
            </div>
        </section>
    );
}

export default About;