import React, { useEffect, useState } from "react";
import { FaExpand } from "react-icons/fa";
import { LEVELS, getLevel, setLevel } from "../../flow/watcher";
import { isConfigured } from "../../llm/config";
import { toggleFocus } from "../../focus";
import SpinnerIcon from "../SpinnerIcon";
import "./Flow.css";

/** Flow level picker and the blank-page button, for the scene page. */
const FlowControl = () => {
  const [level, setL] = useState(getLevel());
  useEffect(() => {
    const on = (e) => setL(e.detail);
    window.addEventListener("silky-flow-level", on);
    return () => window.removeEventListener("silky-flow-level", on);
  }, []);
  const cur = LEVELS.find((l) => l.id === level) || LEVELS[0];
  return (
    <div className="flowControl">
      <label className="flowControl__level" title={cur.blurb + (isConfigured() ? "" : " (connect a model first)")}>
        <SpinnerIcon /> Flow
        <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={!isConfigured()}>
          {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>
      <button type="button" className="flowControl__focus" onClick={toggleFocus} title="Blank page — just the scene; Esc to come back"><FaExpand /> Blank page</button>
    </div>
  );
};

export default FlowControl;
