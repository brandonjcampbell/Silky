import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { store } from "../../NewContext";
import { placeScenes, fmtDate, fmtDuration, hasWhen, unitMs, calendarYear } from "../../time";
import { plain, styleStats, fmt, pct } from "../../analysis/text";
import { loadReader, allReaders } from "../../analysis/reader";
import "./Timeline.css";

/* ── lenses: what a scene's marker can show besides when it happens ── */
const LENSES = [
  { id: "none", name: "Just when" },
  { id: "words", name: "Length", value: (st) => st.words, label: (v) => `${fmt(v)} words`, hint: "bigger is longer" },
  { id: "dialogue", name: "Dialogue", value: (st) => st.dialogue, label: (v) => `${pct(v)} dialogue`, hint: "bigger is talkier", max: 1 },
  { id: "rhythm", name: "Sentence length", value: (st) => st.avgSentence, label: (v) => `${fmt(v, 1)} words a sentence`, hint: "bigger is longer sentences" },
  { id: "grade", name: "Reading grade", value: (st) => st.grade, label: (v) => `grade ${fmt(v, 1)}`, hint: "bigger is harder" },
];
const PACE_COLOR = { slow: "#5b9bd5", steady: "#6aa84f", brisk: "#e69138", rushed: "#cc0000" };
const scoreColor = (n) => ["#cc0000", "#e69138", "#b8a000", "#6aa84f", "#2e8b57"][Math.max(1, Math.min(5, Math.round(n))) - 1];

const tickStep = (span) => {
  const DAY = unitMs("days"), MONTH = unitMs("months"), YEAR = unitMs("years");
  const steps = [3600e3, 6 * 3600e3, DAY, 7 * DAY, MONTH, 3 * MONTH, YEAR, 10 * YEAR, 100 * YEAR];
  return steps.find((s) => span / s <= 10) || steps[steps.length - 1];
};
const tickLabel = (ms, step) => {
  const DAY = unitMs("days"), YEAR = unitMs("years");
  return step < DAY ? fmtDate(ms, { time: true, year: false }) : step < 30 * DAY ? fmtDate(ms, { year: false }) : step < YEAR ? fmtDate(ms).replace(/^\d+ /, "") : String(calendarYear(ms));
};
const W = 1000, ROW = 22, LANE_PAD = 10, TOP = 30;

/** Pack items into rows so nothing overlaps — the mark plus its label, which
    sits to the right unless the scene is near the right edge. */
const packRows = (items, x, extra = 0) => {
  const rows = []; // per row, the [start,end] spans taken
  return items.map((it) => {
    const x0 = x(it.start), x1 = Math.max(x(it.end), x0 + 2);
    const lw = Math.min(220, 8 + it.scene.name.length * 6.2) + extra;
    const left = x1 + 8 > W * 0.78;
    const a = left ? x0 - lw : x0, b = left ? x1 : x1 + lw;
    let r = rows.findIndex((spans) => spans.every(([s, e]) => e < a - 6 || s > b + 6));
    if (r < 0) { r = rows.length; rows.push([]); }
    rows[r].push([a, b]);
    return { ...it, row: r, left };
  }).map((it) => ({ ...it, rows: rows.length }));
};

/**
 * Scenes on a time axis. `lanes` = [{ name, color, scenes }] — one per thread;
 * a single `scenes` prop is one lane. Dated scenes are solid, offsets dimmer,
 * assumed ones hollow; durations are bars. Click a scene to open it.
 */
const Timeline = ({ scenes, lanes: lanesProp, title }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const lanes = useMemo(() => (lanesProp && lanesProp.length ? lanesProp : [{ name: title || "Scenes", color: null, scenes: scenes || [] }]), [lanesProp, scenes, title]);
  const [lens, setLens] = useState(() => { try { return localStorage.getItem("silky:timeline-lens") || "none"; } catch (e) { return "none"; } });
  const pickLens = (id) => { setLens(id); try { localStorage.setItem("silky:timeline-lens", id); } catch (e) { /* */ } };
  // per-scene text statistics, once per scene
  const stats = useMemo(() => {
    const m = new Map();
    lanes.forEach((l) => l.scenes.forEach((sc) => { if (!m.has(sc.file)) m.set(sc.file, styleStats(plain(sc.content))); }));
    return m;
  }, [lanes]);
  // readers who have notes on any of these scenes
  const readerData = useMemo(() => loadReader(dir), [dir, lanes]); // eslint-disable-line react-hooks/exhaustive-deps
  const readers = allReaders(readerData).filter((r) => readerData.readers[r.id] && lanes.some((l) => l.scenes.some((sc) => readerData.readers[r.id].scenes[sc.file])));
  const readerLens = lens.startsWith("reader:") ? lens.slice(7) : null;
  const noteOf = (file) => (readerLens && readerData.readers[readerLens] ? readerData.readers[readerLens].scenes[file] : null);
  const lensDef = LENSES.find((l) => l.id === lens) || LENSES[0];
  const lensVals = lensDef.value ? [...stats.values()].map(lensDef.value).filter(Number.isFinite) : [];
  const lensMax = lensDef.max || (lensVals.length ? Math.max(...lensVals) : 1) || 1;
  /** radius scale 3.5–10 for the lens value, and a colour for reader lenses */
  const mark = (file) => {
    const st = stats.get(file);
    if (readerLens) { const n = noteOf(file); return n ? { r: 3.5 + (n.engagement / 5) * 6.5, color: scoreColor(n.engagement), text: `${n.engagement}/5 · ${n.pace}` } : { r: 4.5, hollow: true, text: "not read" }; }
    if (!lensDef.value || !st) return { r: 4.5 };
    const v = lensDef.value(st);
    return { r: 3.5 + Math.sqrt(Math.max(0, v) / lensMax) * 6.5, text: lensDef.label(v) };
  };
  // the first lane (the manuscript, usually) places scenes; other lanes reuse
  // those times for scenes without a date of their own, so a scene sits at
  // the same moment in every lane
  const placedLanes = (() => { // recomputed every render: cheap, and the calendar can change underneath
    const known = new Map();
    return lanes.map((l, i) => {
      const placed = placeScenes(l.scenes, i ? known : null);
      if (!i) placed.forEach((p) => { if (!p.unplaced) known.set(p.scene.file, p); });
      return { ...l, placed };
    });
  })();
  const on = placedLanes.flatMap((l) => l.placed.filter((p) => !p.unplaced));
  const off = placedLanes.flatMap((l) => l.placed.filter((p) => p.unplaced).map((p) => ({ ...p, lane: l })));
  const [hover, setHover] = useState(null);
  const [pick, setPick] = useState(null); // scene whose card is pinned open
  const [, setCalTick] = useState(0);
  useEffect(() => { const on = () => setCalTick((t) => t + 1); window.addEventListener("silky-calendar", on); return () => window.removeEventListener("silky-calendar", on); }, []);
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
    const items = packRows(l.placed.filter((p) => !p.unplaced), x, lens === "none" ? 0 : 80);
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
        <label className="timeline__lens">Show
          <select value={lens} onChange={(e) => pickLens(e.target.value)}>
            {LENSES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            {readers.length > 0 && <optgroup label="Reader">{readers.map((r) => <option key={r.id} value={"reader:" + r.id}>{r.name}</option>)}</optgroup>}
          </select>
          {lensDef.hint && !readerLens && <small>{lensDef.hint}</small>}
          {readerLens && <small>size and colour are engagement · hover for the reaction</small>}
        </label>
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
              const mk = mark(p.scene.file);
              const cls = "timeline__scene" + (p.anchored ? " is-anchored" : p.inferred ? " is-inferred" : " is-relative") + (hover === p.scene.file ? " is-hover" : "") + (mk.hollow ? " is-unread" : "");
              const left = p.left;
              const style = mk.color ? { "--lane": mk.color } : undefined;
              return (
                <g key={p.scene.file} className={cls} style={style} onMouseEnter={() => setHover(p.scene.file)} onMouseLeave={() => setHover(null)} onClick={() => setPick(pick === p.scene.file ? null : p.scene.file)}>
                  {p.duration > 0 ? <rect x={x0} y={yy + 5.5 - mk.r} width={x1 - x0} height={mk.r * 2} rx={3} className="timeline__bar" /> : <circle cx={x0} cy={yy + 5.5} r={mk.r} className="timeline__dot" />}
                  <text x={left ? x0 - 8 - mk.r : x1 + 8 + (p.duration > 0 ? 0 : mk.r - 4.5)} y={yy + 9.5} className="timeline__label" textAnchor={left ? "end" : "start"}>{p.scene.icon} {p.scene.name}{mk.text && lens !== "none" ? <tspan className="timeline__val"> · {mk.text}</tspan> : null}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      {(() => {
        const file = pick || hover;
        const sc = file && lanes.flatMap((l) => l.scenes).find((x) => x.file === file);
        const st = sc && stats.get(file);
        if (!sc || !st) return null;
        const notes = readers.map((r) => ({ reader: r, note: readerData.readers[r.id].scenes[file] })).filter((x) => x.note);
        return (
          <div className={"sceneCard" + (pick ? " is-pinned" : "")}>
            <div className="sceneCard__head">
              <Link to={"/elements/" + file}>{sc.icon} {sc.name}</Link>
              {pick && <button type="button" className="xbtn" onClick={() => setPick(null)} aria-label="Close">×</button>}
            </div>
            <dl className="sceneCard__stats">
              <div><dt>Words</dt><dd>{fmt(st.words)}</dd></div>
              <div><dt>Dialogue</dt><dd>{pct(st.dialogue)}</dd></div>
              <div><dt>Sentence</dt><dd>{fmt(st.avgSentence, 1)} ± {fmt(st.sdSentence, 1)}</dd></div>
              <div><dt>Grade</dt><dd>{fmt(st.grade, 1)}</dd></div>
              <div><dt>Adverbs</dt><dd>{fmt(st.adverbsPer1k, 1)}‰</dd></div>
              <div><dt>Read</dt><dd>{st.readingMinutes < 1 ? "under a minute" : `${fmt(st.readingMinutes, 0)} min`}</dd></div>
            </dl>
            {notes.map(({ reader, note }) => (
              <div key={reader.id} className="sceneCard__note">
                <p className="sceneCard__reader"><b>{reader.name}</b> <span style={{ color: scoreColor(note.engagement) }}>●</span> engagement {note.engagement}/5 · clarity {note.clarity}/5 · <span style={{ color: PACE_COLOR[note.pace] }}>{note.pace}</span></p>
                <p>{note.reaction}</p>
                {note.questions && note.questions.length > 0 && <ul>{note.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>}
                {note.memorable && <p className="sceneCard__quote">“{note.memorable}”</p>}
              </div>
            ))}
            {notes.length === 0 && readers.length === 0 && <p className="muted">No reader has read this yet — run one under Analyses › Reader to see reactions here.</p>}
            {!pick && <p className="sceneCard__tip">click the scene to keep this open</p>}
          </div>
        );
      })()}
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
                  <Link to={"/elements/" + p.scene.file}>{p.scene.icon} {p.scene.name}{lens !== "none" && mark(p.scene.file).text ? <small className="timeline__val"> · {mark(p.scene.file).text}</small> : null}</Link>
                  {p.scene.when && p.scene.when.note && <span className="timeline__note">{p.scene.when.note}</span>}
                  {readerLens && noteOf(p.scene.file) && <span className="timeline__note timeline__reaction">{noteOf(p.scene.file).reaction}</span>}
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
