import React, { useContext, useState } from "react";
import { FaHistory } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadFile, saveFile } from "../../utils/";
import { versionsOf, diffWords, forgetHistory } from "../../history";
import "./History.css";

const when = (t) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Versions of this actor, a word diff against the one before, and restore. */
const History = ({ element, onChange }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(null); // index into versions
  const [tick, setTick] = useState(0);
  const versions = versionsOf(dir, element.file); // newest first
  void tick;

  if (!versions.length) return null;

  const restore = (v) => {
    const a = loadFile(dir + element.file) || element;
    a.name = v.name;
    a.icon = v.icon || a.icon;
    if (typeof a.content === "string") a.content = v.content;
    saveFile(dir + a.file, a);
    setPick(null);
    setTick((t) => t + 1);
    onChange && onChange();
  };

  const sel = pick == null ? null : versions[pick];
  const prev = pick == null ? null : versions[pick + 1];
  const diff = sel ? diffWords(prev ? prev.content : "", sel.content) : null;
  const added = diff ? diff.filter((d) => d.type === "ins").reduce((n, d) => n + (d.text.match(/\S+/g) || []).length, 0) : 0;
  const removed = diff ? diff.filter((d) => d.type === "del").reduce((n, d) => n + (d.text.match(/\S+/g) || []).length, 0) : 0;

  return (
    <section className={"history" + (open ? " is-open" : "")}>
      <button type="button" className="history__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <FaHistory /> <span>History</span>
        <span className="history__summary">{versions.length} version{versions.length === 1 ? "" : "s"} · last {when(versions[0].at)}</span>
        <span className="history__chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="history__body">
          <ol className="history__list">
            {versions.map((v, i) => {
              const before = versions[i + 1];
              const delta = before ? v.words - before.words : null;
              return (
                <li key={v.at} className={pick === i ? "is-picked" : ""}>
                  <button type="button" className="history__row" onClick={() => setPick(pick === i ? null : i)}>
                    <span className="history__when">{when(v.at)}{v.since && v.since !== v.at ? <small> (from {when(v.since)})</small> : null}</span>
                    <span className="history__name">{v.icon} {v.name}{before && before.name !== v.name ? <small> was “{before.name}”</small> : null}</span>
                    <span className="history__words">{v.words.toLocaleString()} w{delta != null && delta !== 0 ? <b className={delta > 0 ? "up" : "down"}> {delta > 0 ? "+" : ""}{delta}</b> : null}{v.first ? <small> original</small> : null}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {sel && (
            <div className="history__diff">
              <div className="history__diffbar">
                <span>Changes in this version <small>+{added} −{removed} words{prev ? ` against ${when(prev.at)}` : ""}</small></span>
                {pick !== 0 && <button type="button" onClick={() => restore(sel)}>Restore this version</button>}
                {pick === 0 && <span className="muted">current</span>}
              </div>
              <div className="history__text">
                {diff.map((d, i) => d.text === "\n" ? <br key={i} /> : <span key={i} className={"d-" + d.type}>{d.text.split("\n").map((part, j, arr) => <React.Fragment key={j}>{part}{j < arr.length - 1 && <br />}</React.Fragment>)} </span>)}
              </div>
            </div>
          )}
          <p className="history__foot">Versions collapse when saves are within two minutes; the last {40} are kept. <button type="button" className="linkish" onClick={() => { if (window.confirm("Forget this item’s history?")) { forgetHistory(dir, element.file); setTick((t) => t + 1); setOpen(false); } }}>Forget history</button></p>
        </div>
      )}
    </section>
  );
};

export default History;
