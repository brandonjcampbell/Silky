import React from "react";
import "./Revision.css";

/**
 * Preview of a woven revision: the writer's words as they were, Spinner's
 * additions underlined, dropped words struck through. Apply or discard.
 */
const Revision = ({ result, busy, onApply, onDiscard, sceneName }) => {
  if (!result) return null;
  const paras = [[]];
  result.ops.forEach((o) => {
    if (o.tok.t === "¶") {
      if (o.type === "del") return;
      if (paras[paras.length - 1].length) paras.push([]);
    } else paras[paras.length - 1].push(o);
  });
  return (
    <div className="revision">
      <div className="revision__head">
        <strong>Spinner’s revision{sceneName ? ` of “${sceneName}”` : ""}</strong>
        <span className="revision__stat is-ins">+{result.added} word{result.added === 1 ? "" : "s"} from Spinner</span>
        <span className="revision__stat is-del">−{result.removed} of yours</span>
      </div>
      <div className="revision__text">
        {paras.filter((p) => p.length).map((p, i) => (
          <p key={i}>
            {p.map((o, k) => {
              const sep = k ? " " : "";
              if (o.type === "ins") return <React.Fragment key={k}>{sep}<ins>{o.tok.w}</ins></React.Fragment>;
              if (o.type === "del") return <React.Fragment key={k}>{sep}<del>{o.tok.w}</del></React.Fragment>;
              return <React.Fragment key={k}>{sep}{o.tok.w}</React.Fragment>;
            })}
          </p>
        ))}
      </div>
      <div className="revision__actions">
        <button type="button" className="primary" onClick={onApply} disabled={busy || (!result.added && !result.removed)}>Apply — only the new words are marked as Spinner’s</button>
        <button type="button" onClick={onDiscard} disabled={busy}>Discard</button>
      </div>
    </div>
  );
};

export default Revision;
