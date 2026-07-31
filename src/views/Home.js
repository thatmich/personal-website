import "./Home.css"
import About from "./home/About";
import Work from "./home/Work";
import Portfolio from "./home/Portfolio";
import Contact from "./home/Contact";

const Home = () => {
    return (
    <div className="Home">
        <div id="about"/>
        <About />
        <div id="work"/>
        <Work />
        <div id="portfolio"/>
        <Portfolio />
        <div id="contact"/>
        <Contact />
    </div>
    
    );
}

export default Home;