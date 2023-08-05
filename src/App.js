import me from './me.jpg';
import './App.css';
import DocumentMeta from 'react-document-meta';

function App() {
  const meta = {
    title: "Michio Sun",
    description: 'Developer based in Tokyo. Currently attends school at Tsinghua University in Beijing, majoring in Computer Science.',
    canonical: 'http://michiosun.com/',
    meta: {
      charset: 'utf-8',
      name: {
        keywords: 'developer, python, c++, tsinghua, portfolio, michio, sun, michiosun, programmer, quant,'
      }
    }
  };
  return (
    <DocumentMeta {...meta}>
      <div className="App">
        <h1>Michio Sun</h1>
        <img src={me} alt="Michio and his favorite spot to read, 2023" width="200"/>
        <h2>About</h2>
        <p>
          Michio Sun (孙迪往) is a developer based in Tokyo, Japan. 
          He currently attends school at Tsinghua University in Beijing, China, majoring in Computer Science.
          <br />
          He is interested in machine learning, quantative finance, and quantum computing.
          <br />
          In his free time, he "enjoys" running marathons, playing the guitar, and watching motorsports.
        </p>
        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:sun-dw21@mails.tsinghua.edu.cn">sun-dw21@mails.tsinghua.edu.cn</a>
          <br />
          Other ways to contact me: <a href="https://www.linkedin.com/in/michiosun/">LinkedIn</a> <a href="https://twitter.com/michiosun">Twitter</a>
          <br />
          My work: <a href="https://github.com/thatmich/">GitHub</a>
        </p>
      </div>
    </DocumentMeta>
  );
}

export default App;
