import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { placeScenes, fmtDate, fmtDuration, hasWhen } from "../../time";
import "./Timeline.css";

const DAY = 86400e3;
/** Tick spacing that gives a few ticks across the span. */
const tickStep = (span) => {
  const steps = [3600e3, 6 * 3600e3, DAY, 7 * DAY, 30.4375 * DAY, 91.3 * DAY, 365.25 * DAY, 10 * 365.25 * DAY, 100 * 365.25 * DAY];
  return steps.find((s) => span / s <= 10) || steps[steps.length - 1];
};
const tickLabel = (ms, step) => (step < DAY ? fmtDate(ms, { time: true, year: false }) : step < 30 * DAY ? fmtDate(ms, { year: false }) : step < 365 * DAY ? fmtDate(ms).replace(/^\d+ /, "") : String(new Date(ms).getUTCFullYear()));

/**
 * A thread's scenes on a time axis. Anchored scenes are solid, relative ones
 * dashed, inferred ones hollow; a duration becomes a bar. Click to open.
 */
const Timeline = ({ scenes, title }) => {
  const placed = useMemo(() => placeScenes(scenes), [scenes]);
  const on = placed.filter((p) => !p.unplaced);
  const off = placed.filter((p) => p.unplaced);
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!scenes.length) return <p className="timeline__empty">No scenes in this thread.</p>;
  if (!on.length) return <p className="timeline__empty">Nothing is placed in time yet. Open a scene and set <b>When does this happen?</b> — one date anchors the thread; the rest can follow by offsets.</p>;

  const min = Math.min(...on.map((p) => p.start));
  const max = Math.max(...on.map((p) => p.end));
  const span = Math.max(max - min, 3600e3);
  const pad = span * 0.04;
  const t0 = min - pad, t1 = max + pad;
  const W = 1000, H = 60 + on.length * 26;
  const x = (t) => ((t - t0) / (t1 - t0)) * W;
  const step = tickStep(t1 - t0);
  const ticks = [];
  for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) ticks.push(t);
  const total = max - min;

  return (
    <div className="timeline" ref={ref}>
      <div className="timeline__head">
        <span>{title || "Timeline"} · {on.length} scene{on.length === 1 ? "" : "s"} over {fmtDuration(total) || "a moment"} · {fmtDate(min)} → {fmtDate(max)}</span>
      </div>
      <svg className="timeline__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Scenes on a time axis">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={28} y2={H} className="timeline__grid" />
            <text x={x(t)} y={18} className="timeline__tick" textAnchor="middle">{tickLabel(t, step)}</text>
          </g>
        ))}
        <line x1={0} x2={W} y1={28} y2={28} className="timeline__axis" />
        {on.map((p, i) => {
          const y = 40 + i * 26;
          const x0 = x(p.start), x1 = Math.max(x(p.end), x0 + 2);
          const cls = "timeline__scene" + (p.anchored ? " is-anchored" : p.inferred ? " is-inferred" : " is-relative") + (hover === p.scene.file ? " is-hover" : "");
          return (
            <g key={p.scene.file} className={cls} onMouseEnter={() => setHover(p.scene.file)} onMouseLeave={() => setHover(null)}>
              <line x1={x0} x2={x0} y1={28} y2={y + 6} className="timeline__drop" />
              {p.duration > 0 ? <rect x={x0} y={y} width={x1 - x0} height={12} rx={3} className="timeline__bar" /> : <circle cx={x0} cy={y + 6} r={5} className="timeline__dot" />}
              {x1 + 8 > W * 0.78
                ? <text x={x0 - 8} y={y + 10} className="timeline__label" textAnchor="end">{p.scene.icon} {p.scene.name}</text>
                : <text x={x1 + 8} y={y + 10} className="timeline__label" textAnchor="start">{p.scene.icon} {p.scene.name}</text>}
            </g>
          );
        })}
      </svg>
      <ol className="timeline__list">
        {on.map((p, i) => (
          <li key={p.scene.file} className={hover === p.scene.file ? "is-hover" : ""} onMouseEnter={() => setHover(p.scene.file)} onMouseLeave={() => setHover(null)}>
            <span className="timeline__when">
              {fmtDate(p.start, { time: true })}{p.duration > 0 ? ` – ${fmtDate(p.end, { time: true })} (${fmtDuration(p.duration)})` : ""}
              {i > 0 && p.start > on[i - 1].end ? <small> · {fmtDuration(p.start - on[i - 1].end)} after the previous</small> : null}
              {i > 0 && p.start < on[i - 1].start ? <small className="is-back"> · goes back {fmtDuration(on[i - 1].start - p.start)}</small> : null}
              <em>{p.anchored ? "dated" : p.inferred ? "assumed to follow" : "offset"}</em>
            </span>
            <Link to={"/elements/" + p.scene.file}>{p.scene.icon} {p.scene.name}</Link>
            {p.scene.when && p.scene.when.note && <span className="timeline__note">{p.scene.when.note}</span>}
          </li>
        ))}
      </ol>
      {off.length > 0 && (
        <p className="timeline__off">Before any anchor, so not placed: {off.map((p) => <Link key={p.scene.file} to={"/elements/" + p.scene.file}>{p.scene.icon} {p.scene.name}</Link>).reduce((a, b) => [a, ", ", b])}. Give the first of them a date.</p>
      )}
      {!scenes.some(hasWhen) ? null : <p className="timeline__legend"><i className="is-anchored" /> dated · <i className="is-relative" /> offset from the previous · <i className="is-inferred" /> assumed to follow · a bar is a duration</p>}
    </div>
  );
};

export default Timeline;
