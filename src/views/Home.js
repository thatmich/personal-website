import "./Home.css"
import About from "./home/About";
import Work from "./home/Work";
import HomeBlog from "./home/HomeBlog";
import Contact from "./home/Contact";

const Home = ({ posts = [] }) => {
    return (
    <div className="Home">
        <div id="about"/>
        <About />
        <div id="work"/>
        <Work />
        <div id="blog"/>
        <HomeBlog posts={posts} />
        <div id="contact"/>
        <Contact />
    </div>
    
    );
}

export default Home;