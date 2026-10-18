import React from "react";
import { FaInfoCircle, FaGithub } from "react-icons/fa";
import logo from "../../images/logo.svg";
import "./About.css";

const VERSION = process.env.REACT_APP_VERSION || "0.1.0";
const BUILD = (process.env.REACT_APP_BUILD || "").slice(0, 7);

/** Who made it, what you may do with it, and what you take on by using it. */
const About = () => (
  <div className="workspace about">
    <h1 className="workspaceHeader">
      <span className="typeIcon"><FaInfoCircle /></span>
      <p>About Silky</p>
      <span className="workspaceHeader__blurb">Version {VERSION}{BUILD ? ` · build ${BUILD}` : ""}</span>
    </h1>
    <div className="about__body">
      <img className="about__logo" src={logo} alt="Silky" />
      <p className="about__lede">A narrative development assistant: a word processor for fiction whose document is a graph. Write on a blank page; the story bible builds itself behind you.</p>
      <dl className="about__facts">
        <dt>Author</dt><dd>Brandon Campbell</dd>
        <dt>Version</dt><dd>{VERSION}{BUILD ? ` (build ${BUILD})` : ""}</dd>
        <dt>Source</dt><dd><a href="https://github.com/brandonjcampbell/Silky" target="_blank" rel="noreferrer"><FaGithub /> github.com/brandonjcampbell/Silky</a></dd>
        <dt>License</dt><dd>CC0 1.0 Universal — released into the public domain. You may copy, change, distribute and use it, including commercially, without asking. <a href="https://github.com/brandonjcampbell/Silky/blob/main/LICENSE.md" target="_blank" rel="noreferrer">Full text</a></dd>
      </dl>

      <h3>Your data</h3>
      <p>Everything you write stays in this browser (IndexedDB) or in a folder you connect. Nothing is sent anywhere unless you connect Spinner to a language model, in which case the text Spinner is asked about — scenes, descriptions, facts, your messages — goes to the provider you chose, under that provider's terms. The in-browser model runs entirely on your own machine. API keys are kept in this browser's local storage and sent only to the address you enter.</p>
      <p>Back up your work. Export a project (or everything) from Preferences → Storage; a browser can lose its storage when its data is cleared.</p>

      <h3>Terms of use</h3>
      <p>Silky is provided free of charge, as is, for whatever use you choose to make of it.</p>
      <p><strong>No warranty.</strong> The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, title and non-infringement. The author does not warrant that it will be error-free, uninterrupted, or that it will preserve your data.</p>
      <p><strong>Assumption of risk and limitation of liability.</strong> You use Silky at your own risk and are solely responsible for your use of it, for the content you create or import, for keeping backups, and for what you do with anything a connected language model produces. To the fullest extent permitted by law, the author shall not be liable for any claim, damages or other liability — whether in contract, tort or otherwise — arising from or in connection with the software or its use, including loss of data, loss of work, or any direct, indirect, incidental, special or consequential damages, even if advised of the possibility.</p>
      <p><strong>Language-model output.</strong> Text, facts and suggestions produced by Spinner come from a third-party or local model and may be wrong, invented, or someone else's words. You are responsible for reviewing them, for your use of them, and for complying with the terms of the model provider you connect. Silky marks and logs what a model wrote so you can find and remove it, but the judgement is yours.</p>
      <p><strong>Third-party material.</strong> The example projects are built from works in the public domain (Project Gutenberg). What you import is yours to have the rights to.</p>
      <p><strong>Indemnity.</strong> You agree to hold the author harmless from any claim arising out of your use of Silky, the content you put into it, or the content you take out of it.</p>
      <p className="about__fine">By using Silky you accept these terms. If you don't, don't use it. This is a hobby project by one person, offered in good faith; it is not legal, professional or publishing advice, and the author is not a party to anything you write.</p>
    </div>
  </div>
);

export default About;
