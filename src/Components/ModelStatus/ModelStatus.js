import React, { useEffect, useState } from "react";
import { PROGRESS_EVENT, WEBLLM_MODELS } from "../../llm/webllm";
import "./ModelStatus.css";

/** A small corner chip while an in-browser model downloads or loads. */
const ModelStatus = () => {
  const [p, setP] = useState(null);
  useEffect(() => {
    let t;
    const on = (e) => {
      clearTimeout(t);
      if (e.detail.phase === "ready") {
        setP({ ...e.detail, text: "Model ready" });
        t = setTimeout(() => setP(null), 2500);
      } else if (e.detail.phase === "error") {
        setP(e.detail);
        t = setTimeout(() => setP(null), 8000);
      } else setP(e.detail);
    };
    window.addEventListener(PROGRESS_EVENT, on);
    return () => { window.removeEventListener(PROGRESS_EVENT, on); clearTimeout(t); };
  }, []);
  if (!p) return null;
  const m = WEBLLM_MODELS.find((x) => x.id === p.model);
  return (
    <div className={"modelStatus is-" + p.phase} role="status">
      <div className="modelStatus__row">
        <b>{m ? m.name : "Model"}</b>
        <span>{p.phase === "loading" ? `${Math.round((p.progress || 0) * 100)}%` : ""}</span>
      </div>
      <div className="modelStatus__bar"><i style={{ width: `${Math.round((p.progress || 0) * 100)}%` }} /></div>
      <div className="modelStatus__text">{p.text}</div>
    </div>
  );
};

export default ModelStatus;
