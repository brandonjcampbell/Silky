import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { timelineById, updateTimeline, deleteTimeline, LANE_COLORS } from "../../timelines";
import { hasWhen } from "../../time";
import Timeline from "../Timeline";
import "./TimelineView.css";

/** A saved timeline: pick the threads, see them as lanes on one axis. */
const TimelineView = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const { tlId: id } = useParams();
  const navigate = useNavigate();
  const [tl, setTl] = useState(() => timelineById(dir, id));
  const [tick, setTick] = useState(0);
  useEffect(() => { setTl(timelineById(dir, id)); }, [dir, id]);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("silky-flow-changed", on);
    return () => window.removeEventListener("silky-flow-changed", on);
  }, []);
  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, id, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const threads = actors.filter((a) => a.type === "thread").sort((a, b) => (b.name === "Manuscript") - (a.name === "Manuscript") || a.name.localeCompare(b.name));
  if (!tl) return <div className="timelineView"><p className="muted" style={{ padding: 24 }}>That timeline doesn't exist any more. <Link to="/elements">Back</Link></p></div>;
  const save = (next) => { setTl(next); updateTimeline(dir, next); };
  const chosen = tl.threads.filter((f) => byFile.get(f));
  const lanes = chosen.map((f, i) => {
    const t = byFile.get(f);
    return { name: t.name, color: LANE_COLORS[i % LANE_COLORS.length], scenes: (t.sequences || []).map((s) => byFile.get(s)).filter((s) => s && s.type === "snippet") };
  });
  const toggle = (f) => save({ ...tl, threads: tl.threads.includes(f) ? tl.threads.filter((x) => x !== f) : [...tl.threads, f] });
  const datedCount = (t) => (t.sequences || []).map((s) => byFile.get(s)).filter((s) => s && hasWhen(s)).length;

  return (
    <div className="timelineView">
      <div className="timelineView__bar">
        <input className="timelineView__name" value={tl.name} onChange={(e) => save({ ...tl, name: e.target.value })} aria-label="Timeline name" />
        <div className="timelineView__threads">
          {threads.map((t) => {
            const i = tl.threads.indexOf(t.file);
            const on = i >= 0;
            return (
              <label key={t.file} className={"laneChip" + (on ? " is-on" : "")} style={on ? { borderColor: LANE_COLORS[chosen.indexOf(t.file) % LANE_COLORS.length] } : undefined} title={`${t.sequences.length} scenes, ${datedCount(t)} with a time`}>
                <input type="checkbox" checked={on} onChange={() => toggle(t.file)} />
                <i style={{ background: on ? LANE_COLORS[chosen.indexOf(t.file) % LANE_COLORS.length] : "transparent" }} />
                {t.icon} {t.name} <small>{datedCount(t)}/{t.sequences.length}</small>
              </label>
            );
          })}
          {threads.length === 0 && <span className="muted">No threads yet.</span>}
        </div>
        <button type="button" className="timelineView__delete" onClick={() => { if (window.confirm(`Delete the timeline “${tl.name}”?`)) { deleteTimeline(dir, tl.id); navigate("/elements"); } }}><FaTimes /> Delete</button>
      </div>
      <div className="timelineView__body">
        {lanes.length === 0
          ? <p className="muted">Tick the threads to lay on the axis. Each becomes a lane; a scene in several threads appears in each. Set when a scene happens on its page (<b>When does this happen?</b>).</p>
          : <Timeline lanes={lanes} />}
      </div>
    </div>
  );
};

export default TimelineView;
