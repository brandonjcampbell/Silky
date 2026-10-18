import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPen, FaFileImport, FaBookOpen } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir } from "../../utils/";
import { isConfigured } from "../../llm/config";
import { KINDS } from "../../kinds";
import ImportManuscript from "../ImportManuscript";
import SpinnerIcon from "../SpinnerIcon";
import logo from "../../images/logo.svg";
import "./Welcome.css";

/**
 * The editor pane when nothing is open. For an empty project it is the
 * on-ramp: write, import, or look at an example. It always carries the
 * one-paragraph vocabulary, since that is the whole trick of the app.
 */
const Welcome = ({ setRefresh }) => {
  const { state, dispatch } = useContext(store);
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const count = loadDir(state.dir).filter((f) => f.includes(".element.")).length;
  const empty = count === 0;

  const toExamples = () => { dispatch({ action: "setProject", payload: { name: "" } }); navigate("/"); };

  return (
    <div className="welcome">
      <img className="logo" src={logo} alt="" />
      {empty ? (
        <>
          <h2>“{state.project}” is empty. Three ways in:</h2>
          <div className="welcome__doors">
            <button type="button" className="door" onClick={() => navigate("/write")}>
              <FaPen />
              <strong>Just write</strong>
              <span>A blank page. Start with prose; Spinner names the scenes and notices the people and facts as you go.</span>
            </button>
            <button type="button" className="door" onClick={() => setImporting(true)}>
              <FaFileImport />
              <strong>Import a manuscript</strong>
              <span>Paste a draft or fetch a Gutenberg book. Spinner splits it into scenes and extracts the cast, facts and plot threads.</span>
            </button>
            <button type="button" className="door" onClick={toExamples}>
              <FaBookOpen />
              <strong>Open an example</strong>
              <span>A Christmas Carol is the quickest way to see how a finished story bible hangs together.</span>
            </button>
          </div>
        </>
      ) : (
        <h2>Pick something from the list, or add something new.</h2>
      )}
      <dl className="welcome__primer">
        {KINDS.map((k) => (
          <div key={k.id}><dt>{k.glyph} {k.label}</dt><dd>{k.blurb}</dd></div>
        ))}
      </dl>
      <p className="welcome__spinner">
        <SpinnerIcon /> <strong>Spinner</strong> is the built-in assistant: it extracts a story bible from a manuscript, scans scenes for links, suggests and weaves in ideas, simulates readers, and chats as your characters.{" "}
        {isConfigured() ? <Link to="/spinner">Talk to Spinner →</Link> : <Link to="/spinner/settings">Connect a model to turn it on →</Link>}
      </p>
      {importing && (
        <ImportManuscript
          into={state.project}
          onClose={() => setImporting(false)}
          onOpenSettings={() => { setImporting(false); navigate("/spinner/settings"); }}
          onDone={() => { setImporting(false); setRefresh && setRefresh(Date.now()); navigate("/"); }}
        />
      )}
    </div>
  );
};

export default Welcome;
