import React, { useState } from "react";
import { FaRegClock } from "react-icons/fa";
import { DURATION_UNITS, EMPTY_WHEN, hasWhen, whenSummary } from "../../time";
import "./When.css";

/** When a scene happens, and for how long. Absolute, or relative to the scene before it in a thread. */
const When = ({ element, onChange }) => {
  const [open, setOpen] = useState(false);
  const w = { ...EMPTY_WHEN, ...(element.when || {}) };
  const set = (k, v) => { element.when = { ...w, [k]: v }; onChange(element); };
  const mode = w.date ? "abs" : w.relValue !== "" ? "rel" : "abs";
  const [m, setMode] = useState(mode);
  return (
    <section className={"when" + (open ? " is-open" : "")}>
      <button type="button" className="when__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <FaRegClock /> {hasWhen(element) ? whenSummary(element) : "When does this happen?"}
      </button>
      {open && (
        <div className="when__body">
          <div className="when__modes" role="tablist">
            <button type="button" role="tab" aria-selected={m === "abs"} className={m === "abs" ? "is-on" : ""} onClick={() => setMode("abs")}>On a date</button>
            <button type="button" role="tab" aria-selected={m === "rel"} className={m === "rel" ? "is-on" : ""} onClick={() => setMode("rel")}>After the previous scene</button>
          </div>
          {m === "abs" ? (
            <div className="when__row">
              <label>Date <input type="text" value={w.date} placeholder="1897-05-03, 1897, 3 May 1897, -0400" onChange={(e) => { set("date", e.target.value); if (e.target.value) set("relValue", ""); }} /></label>
              <label>Time <input type="text" value={w.time} placeholder="21:30" onChange={(e) => set("time", e.target.value)} /></label>
            </div>
          ) : (
            <div className="when__row">
              <label>Offset <input type="number" step="any" value={w.relValue} placeholder="3" onChange={(e) => { set("relValue", e.target.value); if (e.target.value !== "") set("date", ""); }} /></label>
              <label>Unit <select value={w.relUnit} onChange={(e) => set("relUnit", e.target.value)}>{DURATION_UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
              <span className="muted">after the scene before it in the thread (0 = same moment; negative goes back)</span>
            </div>
          )}
          <div className="when__row">
            <label>Lasts <input type="number" step="any" min="0" value={w.durationValue} placeholder="2" onChange={(e) => set("durationValue", e.target.value)} /></label>
            <label>Unit <select value={w.durationUnit} onChange={(e) => set("durationUnit", e.target.value)}>{DURATION_UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
            <label className="when__note">Note <input type="text" value={w.note} placeholder="the night of the storm; three winters on…" onChange={(e) => set("note", e.target.value)} /></label>
          </div>
          <p className="muted">Scenes with neither a date nor an offset are placed right after the one before them. A thread's Timeline draws all of this on one axis.</p>
        </div>
      )}
    </section>
  );
};

export default When;
