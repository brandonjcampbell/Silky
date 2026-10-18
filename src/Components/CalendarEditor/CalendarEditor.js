import React, { useContext, useEffect, useState } from "react";
import { store } from "../../NewContext";
import { loadCalendar, saveCalendar, GREGORIAN, CUSTOM_DEFAULT, parseCustom, fmtCustom } from "../../calendar";
import "./CalendarEditor.css";

/** The project's calendar: the real one, or your own months, year 0 and era. */
const CalendarEditor = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [cal, setCal] = useState(() => loadCalendar(dir));
  useEffect(() => { setCal(loadCalendar(dir)); }, [dir]);
  const save = (next) => { setCal(next); saveCalendar(dir, next); window.dispatchEvent(new CustomEvent("silky-flow-changed")); };
  const custom = cal.mode === "custom";
  const setMonth = (i, k, v) => save({ ...cal, months: cal.months.map((m, j) => (j === i ? { ...m, [k]: k === "days" ? Math.max(1, Number(v) || 1) : v } : m)) });
  const sampleMs = custom ? parseCustom("0-1-1", "", cal) : null;
  return (
    <div className="calEd">
      <div className="calEd__modes" role="radiogroup">
        <label className={!custom ? "is-on" : ""}><input type="radio" checked={!custom} onChange={() => save(GREGORIAN)} /> Our calendar (Gregorian)</label>
        <label className={custom ? "is-on" : ""}><input type="radio" checked={custom} onChange={() => save(cal.months ? { ...CUSTOM_DEFAULT, ...cal, mode: "custom" } : { ...CUSTOM_DEFAULT })} /> My own calendar</label>
      </div>
      {custom && (
        <>
          <div className="calEd__row">
            <label>Era name <input type="text" value={cal.era || ""} placeholder="e.g. AE, After the Fall" onChange={(e) => save({ ...cal, era: e.target.value })} /></label>
            <label>Hours in a day <input type="number" min="1" max="200" value={cal.hoursPerDay} onChange={(e) => save({ ...cal, hoursPerDay: Math.max(1, Number(e.target.value) || 24) })} /></label>
            <span className="muted">{cal.months.reduce((n, m) => n + Number(m.days || 0), 0)} days in a year · years start at 0; negative years are before the era</span>
          </div>
          <table className="calEd__months">
            <thead><tr><th>#</th><th>Month</th><th>Days</th><th /></tr></thead>
            <tbody>
              {cal.months.map((m, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><input type="text" value={m.name} onChange={(e) => setMonth(i, "name", e.target.value)} /></td>
                  <td><input type="number" min="1" value={m.days} onChange={(e) => setMonth(i, "days", e.target.value)} /></td>
                  <td><button type="button" disabled={cal.months.length <= 1} onClick={() => save({ ...cal, months: cal.months.filter((_, j) => j !== i) })} aria-label="Remove month">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="calEd__add" onClick={() => save({ ...cal, months: [...cal.months, { name: `Month ${cal.months.length + 1}`, days: 30 }] })}>+ month</button>
          <p className="muted">Write dates as <code>year-month-day</code> (<code>12-3-7</code>, <code>0-1-1</code>, <code>-40-2-1</code>) or <code>7 {cal.months[2] ? cal.months[2].name : "Month"} 12</code>, with an optional <code>HH:MM</code>. Today's sample: {sampleMs != null ? fmtCustom(sampleMs, {}, cal) : ""} is the first day of year 0.</p>
        </>
      )}
      {!custom && <p className="muted">Dates like <code>1897-05-03</code>, <code>1897</code>, <code>3 May 1897</code> or <code>-0400</code> (400 BC). Switch to your own calendar for an invented world: name the months, set their lengths, start at year 0.</p>}
    </div>
  );
};

export default CalendarEditor;
