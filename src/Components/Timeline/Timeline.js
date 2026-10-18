import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { placeScenes, fmtDate, fmtDuration, hasWhen } from "../../time";
import "./Timeline.css";

const DAY = 86400e3;
const tickStep = (span) => {
  const steps = [3600e3, 6 * 3600e3, DAY, 7 * DAY, 30.4375 * DAY, 91.3 * DAY, 365.25 * DAY, 10 * 365.25 * DAY, 100 * 365.25 * DAY];
  return steps.find((s) => span / s <= 10) || steps[steps.length - 1];
};
const tickLabel = (ms, step) => (step < DAY ? fmtDate(ms, { time: true, year: false }) : step < 30 * DAY ? fmtDate(ms, { year: false }) : step < 365 * DAY ? fmtDate(ms).replace(/^\d+ /, "") : String(new Date(ms).getUTCFullYear()));
const W = 1000, ROW = 22, LANE_PAD = 10, TOP = 30;

/** Pack items into rows so nothing overlaps (x-extent plus an estimated label width). */
const packRows = (items, x) => {
  const rows = [];
  return items.map((it) => {
    const x0 = x(it.start), x1 = Math.max(x(it.end), x0 + 2) + Math.min(220, 8 + it.scene.name.length * 6.2);
    let r = rows.findIndex((end) => end < x0 - 6);
    if (r < 0) { r = rows.length; rows.push(x1); } else rows[r] = x1;
    return { ...it, row: r };
  }).map((it) => ({ ...it, rows: rows.length }));
};

/**
 * Scenes on a time axis. `lanes` = [{ name, color, scenes }] — one per thread;
 * a single `scenes` prop is one lane. Dated scenes are solid, offsets dimmer,
 * assumed ones hollow; durations are bars. Click a scene to open it.
 */
const Timeline = ({ scenes, lanes: lanesProp, title }) => {
  const lanes = useMemo(() => (lanesProp && lanesProp.length ? lanesProp : [{ name: title || "Scenes", color: null, scenes: scenes || [] }]), [lanesProp, scenes, title]);
  const placedLanes = useMemo(() => lanes.map((l) => ({ ...l, placed: placeScenes(l.scenes) })), [lanes]);
  const on = placedLanes.flatMap((l) => l.placed.filter((p) => !p.unplaced));
  const off = placedLanes.flatMap((l) => l.placed.filter((p) => p.unplaced).map((p) => ({ ...p, lane: l })));
  const [hover, setHover] = useState(null);
  const total = lanes.reduce((n, l) => n + l.scenes.length, 0);
  if (!total) return <p className="timeline__empty">No scenes here yet.</p>;
  if (!on.length) return <p className="timeline__empty">Nothing is placed in time yet. Open a scene and set <b>When does this happen?</b> — one date anchors a thread; the rest can follow by offsets.</p>;

  const min = Math.min(...on.map((p) => p.start));
  const max = Math.max(...on.map((p) => p.end));
  const span = Math.max(max - min, 3600e3);
  const pad = span * 0.04;
  const t0 = min - pad, t1 = max + pad;
  const x = (t) => ((t - t0) / (t1 - t0)) * W;
  const step = tickStep(t1 - t0);
  const ticks = [];
  for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) ticks.push(t);

  // lane geometry
  let y = TOP;
  const laneGeo = placedLanes.map((l) => {
    const items = packRows(l.placed.filter((p) => !p.unplaced), x);
    const rows = items.length ? items[0].rows : 1;
    const g = { lane: l, items, y0: y, h: rows * ROW + LANE_PAD };
    y += g.h;
    return g;
  });
  const H = y + 6;
  const multi = lanes.length > 1;

  return (
    <div className="timeline">
      <div className="timeline__head">
        <span>{on.length} placed scene{on.length === 1 ? "" : "s"} across {lanes.length} thread{lanes.length === 1 ? "" : "s"} · {fmtDuration(max - min) || "a moment"} · {fmtDate(min)} → {fmtDate(max)}</span>
      </div>
      <svg className="timeline__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Scenes on a time axis" style={{ aspectRatio: `${W} / ${H}` }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={TOP - 2} y2={H} className="timeline__grid" />
            <text x={x(t)} y={18} className="timeline__tick" textAnchor="middle">{tickLabel(t, step)}</text>
          </g>
        ))}
        <line x1={0} x2={W} y1={TOP - 2} y2={TOP - 2} className="timeline__axis" />
        {laneGeo.map((g, li) => (
          <g key={li} className="timeline__lane" style={g.lane.color ? { "--lane": g.lane.color } : undefined}>
            {multi && <rect x={0} y={g.y0} width={W} height={g.h} className={"timeline__band" + (li % 2 ? " is-alt" : "")} />}
            {multi && <text x={6} y={g.y0 + 12} className="timeline__laneName">{g.lane.name}</text>}
            {g.items.map((p) => {
              const yy = g.y0 + (multi ? 16 : 6) + p.row * ROW;
              const x0 = x(p.start), x1 = Math.max(x(p.end), x0 + 2);
              const cls = "timeline__scene" + (p.anchored ? " is-anchored" : p.inferred ? " is-inferred" : " is-relative") + (hover === p.scene.file ? " is-hover" : "");
              const left = x1 + 8 > W * 0.78;
              return (
                <g key={p.scene.file} className={cls} onMouseEnter={() => setHover(p.scene.file)} onMouseLeave={() => setHover(null)}>
                  {p.duration > 0 ? <rect x={x0} y={yy} width={x1 - x0} height={11} rx={3} className="timeline__bar" /> : <circle cx={x0} cy={yy + 5.5} r={4.5} className="timeline__dot" />}
                  <text x={left ? x0 - 8 : x1 + 8} y={yy + 9.5} className="timeline__label" textAnchor={left ? "end" : "start"}>{p.scene.icon} {p.scene.name}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      {laneGeo.map((g, li) => (
        <div key={li} className="timeline__laneList">
          {multi && <h5 style={g.lane.color ? { color: g.lane.color } : undefined}>{g.lane.name}</h5>}
          <ol className="timeline__list">
            {g.items.map((p, i) => {
              const prev = g.items[i - 1];
              return (
                <li key={p.scene.file} className={hover === p.scene.file ? "is-hover" : ""} onMouseEnter={() => setHover(p.scene.file)} onMouseLeave={() => setHover(null)}>
                  <span className="timeline__when">
                    {fmtDate(p.start, { time: true })}{p.duration > 0 ? ` – ${fmtDate(p.end, { time: true })} (${fmtDuration(p.duration)})` : ""}
                    {prev && p.start > prev.end ? <small> · {fmtDuration(p.start - prev.end)} after the previous</small> : null}
                    {prev && p.start < prev.start ? <small className="is-back"> · goes back {fmtDuration(prev.start - p.start)}</small> : null}
                    <em>{p.anchored ? "dated" : p.inferred ? "assumed to follow" : "offset"}</em>
                  </span>
                  <Link to={"/elements/" + p.scene.file}>{p.scene.icon} {p.scene.name}</Link>
                  {p.scene.when && p.scene.when.note && <span className="timeline__note">{p.scene.when.note}</span>}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      {off.length > 0 && (
        <p className="timeline__off">Before any anchor, so not placed: {off.map((p) => <Link key={p.lane.name + p.scene.file} to={"/elements/" + p.scene.file}>{p.scene.icon} {p.scene.name}</Link>).reduce((a, b) => [a, ", ", b])}. Give the first of them a date.</p>
      )}
      {lanes.some((l) => l.scenes.some(hasWhen)) && <p className="timeline__legend"><i className="is-anchored" /> dated · <i className="is-relative" /> offset from the previous · <i className="is-inferred" /> assumed to follow · a bar is a duration</p>}
    </div>
  );
};

export default Timeline;
