import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { loadProgress, setGoals, dayKey, addDays, dayRange, streaks } from "../../progress";
import { loadProvenance } from "../../provenance";
import { fmt } from "../../analysis/text";
import "./Progress.css";

const words = (html) => (String(html || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const niceDay = (k) => { const d = new Date(k + "T12:00:00"); return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); };

const Stat = ({ label, value, sub, accent }) => (
  <div className={"stat" + (accent ? " stat--accent" : "")}><b>{value}</b><span>{label}</span>{sub && <small>{sub}</small>}</div>
);

/** Progress: words per day, streaks, goals, and what got made when. */
const Progress = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [tick, setTick] = useState(0);
  const data = useMemo(() => loadProgress(dir), [dir, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const totalWords = actors.filter((a) => a.type === "snippet").reduce((n, a) => n + words(a.content), 0);
  const prov = useMemo(() => loadProvenance(dir), [dir, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = dayKey();
  const goals = data.goals || {};
  const daily = Number(goals.daily) || 0;
  const last30 = dayRange(data, addDays(today, -29));
  const last7 = last30.slice(-7);
  const todayE = data.days[today] || { added: 0, removed: 0, saves: 0, scenes: [], created: {} };
  const writingDays30 = last30.filter((d) => d.added > 0).length;
  const avg30 = writingDays30 ? Math.round(last30.reduce((n, d) => n + d.added, 0) / writingDays30) : 0;
  const week = last7.reduce((n, d) => n + d.added, 0);
  const st = streaks(data);
  const goalSt = daily ? streaks(data, daily - 1) : null;
  const best = Object.entries(data.days).sort((a, b) => b[1].added - a[1].added)[0];
  const allTime = Object.values(data.days).reduce((n, d) => n + d.added, 0);
  const firstDay = Object.keys(data.days).sort()[0];

  // projection toward a target
  const target = Number(goals.target) || 0;
  const remaining = target ? Math.max(0, target - totalWords) : 0;
  const eta = target && remaining && avg30 ? addDays(today, Math.ceil(remaining / avg30)) : null;
  const deadline = goals.deadline || "";
  const daysLeft = deadline ? Math.max(0, Math.round((new Date(deadline + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000)) : null;
  const perDayNeeded = deadline && target && daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;

  // heatmap: 16 weeks ending this week
  const weeks = useMemo(() => {
    const end = new Date(today + "T12:00:00");
    const endSat = addDays(today, 6 - end.getDay());
    const start = addDays(endSat, -16 * 7 + 1);
    const days = dayRange(data, start, endSat).map((d) => ({ ...d, future: d.key > today }));
    const out = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [data, today]);
  const maxDay = Math.max(1, ...weeks.flat().map((d) => d.added));
  const level = (v) => (v <= 0 ? 0 : v < maxDay * 0.25 ? 1 : v < maxDay * 0.5 ? 2 : v < maxDay * 0.75 ? 3 : 4);

  // AI words by day (from provenance)
  const aiByDay = {};
  (prov.insertions || []).forEach((i) => { const k = dayKey(i.at); aiByDay[k] = (aiByDay[k] || 0) + (i.words || 0); });
  const aiWeek = last7.reduce((n, d) => n + (aiByDay[d.key] || 0), 0);

  // recently touched scenes
  const recent = [];
  last7.slice().reverse().forEach((d) => d.scenes.forEach((f) => { if (!recent.find((r) => r.file === f)) recent.push({ file: f, day: d.key }); }));

  // created per week (last 8 weeks)
  const made = useMemo(() => {
    const out = [];
    for (let w = 7; w >= 0; w -= 1) {
      const from = addDays(today, -(w * 7 + 6)), to = addDays(today, -w * 7);
      const c = {};
      dayRange(data, from, to).forEach((d) => Object.entries(d.created || {}).forEach(([t, n]) => { c[t] = (c[t] || 0) + n; }));
      out.push({ from, to, c });
    }
    return out;
  }, [data, today]);

  const update = (k, v) => { setGoals(dir, { [k]: v }); setTick((t) => t + 1); };
  const maxBar = Math.max(daily || 0, 1, ...last30.map((d) => d.added));

  return (
    <div className="progress">
      <div className="progress__goals">
        <label>Daily goal <input type="number" min="0" step="50" value={goals.daily ?? ""} onChange={(e) => update("daily", Number(e.target.value) || 0)} /> words</label>
        <label>Project target <input type="number" min="0" step="1000" value={goals.target ?? ""} placeholder="e.g. 80000" onChange={(e) => update("target", Number(e.target.value) || null)} /> words</label>
        <label>Deadline <input type="date" value={deadline} onChange={(e) => update("deadline", e.target.value || null)} /></label>
      </div>

      <div className="stats">
        <Stat label="words today" value={fmt(todayE.added)} sub={daily ? (todayE.added >= daily ? "goal met ✓" : `${fmt(daily - todayE.added)} to go`) : todayE.removed ? `${fmt(todayE.removed)} cut` : undefined} accent={daily && todayE.added >= daily} />
        <Stat label="day streak" value={st.current} sub={`best ${st.best}${goalSt ? ` · ${goalSt.current} meeting the goal` : ""}`} />
        <Stat label="this week" value={fmt(week)} sub={aiWeek ? `${fmt(aiWeek)} of them from Spinner` : "all yours"} />
        <Stat label="per writing day" value={fmt(avg30)} sub={`${writingDays30} of the last 30 days`} />
        <Stat label="words in scenes" value={fmt(totalWords)} sub={target ? `${fmt(remaining)} to ${fmt(target)}` : firstDay ? `${fmt(allTime)} written since ${niceDay(firstDay)}` : undefined} />
        {target > 0 && <Stat label={deadline ? "needed per day" : "at this pace, done"} value={deadline ? (perDayNeeded != null ? fmt(perDayNeeded) : "—") : eta ? niceDay(eta) : remaining ? "—" : "done ✓"} sub={deadline ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} to ${niceDay(deadline)}${eta ? ` · pace says ${niceDay(eta)}` : ""}` : "from the last 30 days' average"} />}
      </div>

      {daily > 0 && (
        <div className="progress__ring">
          <div className="progress__bar"><i style={{ width: `${Math.min(100, (todayE.added / daily) * 100)}%` }} /></div>
          <span>{Math.min(100, Math.round((todayE.added / daily) * 100))}% of today's goal</span>
        </div>
      )}

      <h3>Last 30 days <small>words added per day{daily ? "; the line is your goal" : ""}</small></h3>
      <div className="progress__days">
        {last30.map((d) => (
          <div key={d.key} className={"progress__day" + (d.key === today ? " is-today" : "") + (daily && d.added >= daily ? " is-met" : "")} title={`${niceDay(d.key)}: ${fmt(d.added)} added${d.removed ? `, ${fmt(d.removed)} cut` : ""}${aiByDay[d.key] ? `, ${fmt(aiByDay[d.key])} from Spinner` : ""}`}>
            <i style={{ height: `${(d.added / maxBar) * 100}%` }} />
            {aiByDay[d.key] ? <em style={{ height: `${(Math.min(aiByDay[d.key], d.added) / maxBar) * 100}%` }} /> : null}
          </div>
        ))}
        {daily > 0 && <div className="progress__goalLine" style={{ bottom: `${(daily / maxBar) * 100}%` }} />}
      </div>
      <div className="progress__axis"><span>{niceDay(last30[0].key)}</span><span>today</span></div>

      <h3>Sixteen weeks <small>every day you wrote; darker is more</small></h3>
      <div className="heat">
        <div className="heat__dow">{DOW.map((d, i) => <span key={i}>{i % 2 ? d : ""}</span>)}</div>
        {weeks.map((w, i) => (
          <div key={i} className="heat__week">
            {w.map((d) => <span key={d.key} className={"heat__cell l" + level(d.added) + (d.future ? " is-future" : "") + (d.key === today ? " is-today" : "")} title={`${niceDay(d.key)}: ${fmt(d.added)} words`} />)}
          </div>
        ))}
      </div>
      {best && best[1].added > 0 && <p className="muted">Best day: {niceDay(best[0])}, {fmt(best[1].added)} words.</p>}

      <h3>Made recently <small>elements, facts, scenes and threads created, by week</small></h3>
      <table className="progress__made">
        <thead><tr><th>Week of</th><th>Elements</th><th>Facts</th><th>Scenes</th><th>Threads</th><th>Webs</th></tr></thead>
        <tbody>
          {made.map((m) => (
            <tr key={m.from}><td>{niceDay(m.from)}</td>{["element", "fact", "snippet", "thread", "web"].map((t) => <td key={t}>{m.c[t] || ""}</td>)}</tr>
          ))}
        </tbody>
      </table>

      {recent.length > 0 && (
        <>
          <h3>Touched this week</h3>
          <ul className="progress__recent">
            {recent.map((r) => { const s = byFile.get(r.file); return s ? <li key={r.file}><Link to={"/elements/" + s.file}>{s.icon} {s.name}</Link> <span className="muted">{niceDay(r.day)} · {fmt(words(s.content))} words</span></li> : null; })}
          </ul>
        </>
      )}
      <p className="muted progress__note">Counted from every save of a scene: words added and words cut, by local day. Words Spinner wrote are counted where they were inserted and shown separately.</p>
    </div>
  );
};

export default Progress;
