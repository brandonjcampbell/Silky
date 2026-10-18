import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaMousePointer, FaMapPin, FaRoute, FaRulerCombined, FaRulerHorizontal, FaImage, FaSearchPlus, FaSearchMinus, FaExpand, FaTrash, FaTimes } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { mapById, updateMap, deleteMap, UNITS, dist, pathLength, fmtDist, newPin, newLine } from "../../maps";
import { isLocation } from "../../role";
import SortRoles from "../RolePicker/SortRoles";
import "./MapView.css";

const TOOLS = [
  { id: "select", name: "Select / pan", icon: FaMousePointer, hint: "Drag the map to pan, scroll to zoom. Click a pin or route to select it; drag a pin to move it. Delete removes the selection." },
  { id: "pin", name: "Pin", icon: FaMapPin, hint: "Click to drop a pin, then pick which location it is." },
  { id: "line", name: "Route", icon: FaRoute, hint: "Click to add points; double-click or Enter to finish; Esc to cancel. The route's length appears beside it." },
  { id: "scale", name: "Set scale", icon: FaRulerCombined, hint: "Click two points you know the distance between, then say how far apart they are. Every other distance follows." },
  { id: "measure", name: "Measure", icon: FaRulerHorizontal, hint: "Click two points to read the distance between them." },
];

/** A map of the story's places: image or blank sheet, scale, pins, routes, distances. */
const MapView = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const { id } = useParams();
  const navigate = useNavigate();
  const [map, setMap] = useState(() => mapById(dir, id));
  const [tool, setTool] = useState("select");
  const [view, setView] = useState({ x: 0, y: 0, z: 0.4 });
  const [sel, setSel] = useState(null); // { kind: "pin"|"line", id }
  const [draft, setDraft] = useState(null); // in-progress line points / scale / measure
  const [cursor, setCursor] = useState(null);
  const [pinFor, setPinFor] = useState(null); // location element file to place next
  const [askPin, setAskPin] = useState(null); // pin id awaiting a location
  const [tick, setTick] = useState(0);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { setMap(mapById(dir, id)); setSel(null); setDraft(null); }, [dir, id]);
  const save = useCallback((next) => { setMap(next); updateMap(dir, next); }, [dir]);

  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, id, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const locations = actors.filter((a) => a.type === "element" && isLocation(a)).sort((a, b) => a.name.localeCompare(b.name));
  const pinned = new Set((map ? map.pins : []).map((p) => p.element).filter(Boolean));

  /* ── coordinates ── */
  const toMap = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.z, y: (e.clientY - r.top - view.y) / view.z };
  };
  const fit = useCallback(() => {
    if (!svgRef.current || !map) return;
    const r = svgRef.current.getBoundingClientRect();
    const z = Math.min((r.width - 40) / map.w, (r.height - 40) / map.h);
    setView({ z, x: (r.width - map.w * z) / 2, y: (r.height - map.h * z) / 2 });
  }, [map && map.w, map && map.h]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fit(); }, [fit, id]);
  const zoomAt = (factor, cx, cy) => setView((v) => {
    const z = Math.min(8, Math.max(0.05, v.z * factor));
    return { z, x: cx - (cx - v.x) * (z / v.z), y: cy - (cy - v.y) * (z / v.z) };
  });
  const onWheel = (e) => { e.preventDefault(); const r = svgRef.current.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); };

  /* ── pointer ── */
  const onDown = (e) => {
    if (e.button === 1 || (e.button === 0 && tool === "select" && !e.target.closest("[data-pin], [data-line]"))) {
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const pinEl = e.target.closest("[data-pin]");
    if (tool === "select" && pinEl) {
      const pid = pinEl.getAttribute("data-pin");
      setSel({ kind: "pin", id: pid });
      const p = map.pins.find((x) => x.id === pid);
      dragRef.current = { kind: "pin", id: pid, start: toMap(e), ox: p.x, oy: p.y, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    const lineEl = e.target.closest("[data-line]");
    if (tool === "select" && lineEl) { setSel({ kind: "line", id: lineEl.getAttribute("data-line") }); return; }
  };
  const onMove = (e) => {
    const m = toMap(e);
    setCursor(m);
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === "pan") {
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
    } else if (d.kind === "pin") {
      const dx = m.x - d.start.x, dy = m.y - d.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) d.moved = true;
      setMap((mp) => ({ ...mp, pins: mp.pins.map((p) => (p.id === d.id ? { ...p, x: d.ox + dx, y: d.oy + dy } : p)) }));
    }
  };
  const onUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.kind === "pin" && d.moved) { updateMap(dir, map); return; }
    if (d && d.kind === "pan" && d.moved) return;
    if (e.button !== 0) return;
    const m = toMap(e);
    if (tool === "pin") {
      const p = newPin(m.x, m.y, pinFor ? { element: pinFor } : {});
      const next = { ...map, pins: [...map.pins, p] };
      save(next);
      setSel({ kind: "pin", id: p.id });
      if (pinFor) { setPinFor(null); setTool("select"); } else setAskPin(p.id);
    } else if (tool === "line") {
      setDraft((dft) => (dft && dft.kind === "line" ? { ...dft, points: [...dft.points, m] } : { kind: "line", points: [m] }));
    } else if (tool === "scale" || tool === "measure") {
      if (!draft || draft.kind !== tool) setDraft({ kind: tool, a: m });
      else if (!draft.b) {
        if (tool === "measure") setDraft({ ...draft, b: m });
        else {
          const cur = map.scale ? map.scale.length : "";
          const ans = window.prompt(`How far apart are these two points, in ${map.unit}?`, cur);
          const len = parseFloat(ans);
          if (ans !== null && len > 0) save({ ...map, scale: { a: draft.a, b: m, length: len } });
          setDraft(null);
          setTool("select");
        }
      } else setDraft({ kind: tool, a: m });
    } else if (tool === "select" && !e.target.closest("[data-pin], [data-line]")) {
      setSel(null);
    }
  };
  const onDouble = () => { if (tool === "line") finishLine(); };
  const finishLine = () => {
    if (draft && draft.kind === "line" && draft.points.length >= 2) {
      const l = newLine(draft.points);
      save({ ...map, lines: [...map.lines, l] });
      setSel({ kind: "line", id: l.id });
    }
    setDraft(null);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") { setDraft(null); setPinFor(null); setAskPin(null); if (tool !== "select") setTool("select"); else setSel(null); }
      else if (e.key === "Enter" && tool === "line") finishLine();
      else if ((e.key === "Delete" || e.key === "Backspace") && sel) { removeSel(); }
      else if (e.key === "v") setTool("select");
      else if (e.key === "p") setTool("pin");
      else if (e.key === "r") setTool("line");
      else if (e.key === "m") setTool("measure");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const removeSel = () => {
    if (!sel) return;
    if (sel.kind === "pin") save({ ...map, pins: map.pins.filter((p) => p.id !== sel.id) });
    else save({ ...map, lines: map.lines.filter((l) => l.id !== sel.id) });
    setSel(null);
  };

  /* ── image ── */
  const onImage = (file) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { window.alert("That image is over 12 MB; a smaller one keeps the project quick to save and export."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { save({ ...map, image: reader.result, w: img.naturalWidth, h: img.naturalHeight }); setTimeout(fit, 0); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  if (!map) return <div className="mapView"><p className="muted" style={{ padding: 24 }}>That map doesn't exist any more. <Link to="/elements">Back</Link></p></div>;

  const selPin = sel && sel.kind === "pin" ? map.pins.find((p) => p.id === sel.id) : null;
  const selLine = sel && sel.kind === "line" ? map.lines.find((l) => l.id === sel.id) : null;
  const pinName = (p) => (p.element && byFile.get(p.element) ? `${byFile.get(p.element).icon || ""} ${byFile.get(p.element).name}`.trim() : p.label || "Pin");
  const measurePx = draft && draft.kind === "measure" ? dist(draft.a, draft.b || cursor || draft.a) : null;
  const scalePx = draft && draft.kind === "scale" && cursor ? dist(draft.a, draft.b || cursor) : null;
  const curTool = TOOLS.find((t) => t.id === tool);
  const px = (n) => n / view.z; // screen pixels in map units, for constant-size marks
  const namedPins = map.pins.filter((p) => p.element || p.label);

  return (
    <div className="mapView">
      <div className="mapView__bar">
        <div className="mapView__tools" role="toolbar">
          {TOOLS.map((t) => { const I = t.icon; return <button key={t.id} type="button" className={"mapTool" + (tool === t.id ? " is-on" : "")} title={`${t.name} — ${t.hint}`} onClick={() => { setTool(t.id); setDraft(null); setPinFor(null); }}><I /></button>; })}
          <span className="mapView__sep" />
          <button type="button" className="mapTool" title="Zoom in" onClick={() => { const r = svgRef.current.getBoundingClientRect(); zoomAt(1.25, r.width / 2, r.height / 2); }}><FaSearchPlus /></button>
          <button type="button" className="mapTool" title="Zoom out" onClick={() => { const r = svgRef.current.getBoundingClientRect(); zoomAt(1 / 1.25, r.width / 2, r.height / 2); }}><FaSearchMinus /></button>
          <button type="button" className="mapTool" title="Fit the whole map" onClick={fit}><FaExpand /></button>
          <span className="mapView__sep" />
          <button type="button" className="mapTool mapTool--text" title="Use an image as the map — a sketch, a scan, anything" onClick={() => fileRef.current && fileRef.current.click()}><FaImage /> {map.image ? "Replace image" : "Use an image"}</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onImage(e.target.files[0]); e.target.value = ""; }} />
          {map.image && <button type="button" className="mapTool mapTool--text" onClick={() => save({ ...map, image: null })}>Blank sheet</button>}
        </div>
        <span className="mapView__hint">{pinFor ? `Click where ${(byFile.get(pinFor) || {}).name} is.` : curTool.hint}</span>
        <span className="mapView__scale">
          {map.scale ? <>Scale: {map.scale.length} {map.unit} ≈ {Math.round(dist(map.scale.a, map.scale.b))} px</> : <em>No scale yet — use the ruler tool.</em>}
          <select value={map.unit} onChange={(e) => save({ ...map, unit: e.target.value })} title="Unit">{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </span>
      </div>

      <div className="mapView__body">
        <svg
          ref={svgRef}
          className={"mapCanvas is-" + tool}
          onWheel={onWheel}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onDoubleClick={onDouble}
          onPointerLeave={() => setCursor(null)}
        >
          <defs>
            <pattern id="mapGrid" width={100} height={100} patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" className="mapGrid__line" /></pattern>
          </defs>
          <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
            {map.image ? <image href={map.image} x={0} y={0} width={map.w} height={map.h} /> : <rect x={0} y={0} width={map.w} height={map.h} className="mapSheet" />}
            {!map.image && <rect x={0} y={0} width={map.w} height={map.h} fill="url(#mapGrid)" />}
            {map.lines.map((l) => {
              const mid = l.points[Math.floor(l.points.length / 2)];
              const on = selLine && selLine.id === l.id;
              return (
                <g key={l.id} data-line={l.id} className={"mapLine" + (on ? " is-selected" : "")}>
                  <polyline points={l.points.map((p) => `${p.x},${p.y}`).join(" ")} strokeWidth={px(on ? 4 : 2.5)} style={l.color ? { stroke: l.color } : undefined} />
                  <polyline points={l.points.map((p) => `${p.x},${p.y}`).join(" ")} strokeWidth={px(14)} className="mapLine__hit" />
                  <text x={mid.x} y={mid.y - px(8)} fontSize={px(12)} className="mapLabel">{l.name ? l.name + " · " : ""}{fmtDist(map, pathLength(l.points))}</text>
                </g>
              );
            })}
            {draft && draft.kind === "line" && (
              <g className="mapLine is-draft">
                <polyline points={[...draft.points, ...(cursor ? [cursor] : [])].map((p) => `${p.x},${p.y}`).join(" ")} strokeWidth={px(2)} />
                {draft.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={px(3)} />)}
                {cursor && draft.points.length > 0 && <text x={cursor.x + px(10)} y={cursor.y - px(10)} fontSize={px(12)} className="mapLabel">{fmtDist(map, pathLength([...draft.points, cursor]))}</text>}
              </g>
            )}
            {map.scale && (
              <g className="mapScale">
                <line x1={map.scale.a.x} y1={map.scale.a.y} x2={map.scale.b.x} y2={map.scale.b.y} strokeWidth={px(2)} />
                <circle cx={map.scale.a.x} cy={map.scale.a.y} r={px(3)} /><circle cx={map.scale.b.x} cy={map.scale.b.y} r={px(3)} />
                <text x={(map.scale.a.x + map.scale.b.x) / 2} y={(map.scale.a.y + map.scale.b.y) / 2 - px(8)} fontSize={px(11)} className="mapLabel">{map.scale.length} {map.unit}</text>
              </g>
            )}
            {draft && (draft.kind === "scale" || draft.kind === "measure") && cursor && (
              <g className={"mapMeasure is-" + draft.kind}>
                <line x1={draft.a.x} y1={draft.a.y} x2={(draft.b || cursor).x} y2={(draft.b || cursor).y} strokeWidth={px(2)} />
                <circle cx={draft.a.x} cy={draft.a.y} r={px(3)} />
                <text x={(draft.a.x + (draft.b || cursor).x) / 2} y={(draft.a.y + (draft.b || cursor).y) / 2 - px(8)} fontSize={px(12)} className="mapLabel mapLabel--big">{draft.kind === "measure" ? fmtDist(map, measurePx) : `${Math.round(scalePx)} px`}</text>
              </g>
            )}
            {map.pins.map((p) => {
              const on = selPin && selPin.id === p.id;
              return (
                <g key={p.id} data-pin={p.id} className={"mapPin" + (on ? " is-selected" : "")} transform={`translate(${p.x} ${p.y})`}>
                  <circle r={px(on ? 9 : 7)} />
                  <circle r={px(2.5)} className="mapPin__dot" />
                  <text x={px(11)} y={px(4)} fontSize={px(12)} className="mapLabel">{pinName(p)}</text>
                </g>
              );
            })}
          </g>
        </svg>

        <aside className="mapView__side">
          <input className="mapView__name" value={map.name} onChange={(e) => save({ ...map, name: e.target.value })} aria-label="Map name" />

          {askPin && (() => { const p = map.pins.find((x) => x.id === askPin); return p ? (
            <div className="mapPanel mapPanel--ask">
              <h5>Which place is this?</h5>
              <select autoFocus value="" onChange={(e) => { if (e.target.value) { save({ ...map, pins: map.pins.map((x) => (x.id === p.id ? { ...x, element: e.target.value } : x)) }); setAskPin(null); } }}>
                <option value="">Pick a location…</option>
                {locations.map((l) => <option key={l.file} value={l.file}>{l.icon} {l.name}{pinned.has(l.file) ? " (pinned)" : ""}</option>)}
              </select>
              <input placeholder="…or just label it" onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { save({ ...map, pins: map.pins.map((x) => (x.id === p.id ? { ...x, label: e.target.value.trim() } : x)) }); setAskPin(null); } }} />
              <div className="mapPanel__row"><button type="button" onClick={() => setAskPin(null)}>Later</button><button type="button" onClick={() => { save({ ...map, pins: map.pins.filter((x) => x.id !== p.id) }); setAskPin(null); setSel(null); }}>Remove pin</button></div>
              <p className="muted">Only elements marked as locations are listed. Mark one on its page (Character / Location / Thing).</p>
            </div>
          ) : null; })()}

          {selPin && !askPin && (
            <div className="mapPanel">
              <h5>Pin</h5>
              <p className="mapPanel__title">{pinName(selPin)}{selPin.element && byFile.get(selPin.element) && <Link to={"/elements/" + selPin.element} className="mapPanel__open">open</Link>}</p>
              <select value={selPin.element || ""} onChange={(e) => save({ ...map, pins: map.pins.map((x) => (x.id === selPin.id ? { ...x, element: e.target.value || null } : x)) })}>
                <option value="">(no location)</option>
                {locations.map((l) => <option key={l.file} value={l.file}>{l.icon} {l.name}</option>)}
              </select>
              <input placeholder="Label" value={selPin.label} onChange={(e) => save({ ...map, pins: map.pins.map((x) => (x.id === selPin.id ? { ...x, label: e.target.value } : x)) })} />
              {namedPins.length > 1 && (
                <>
                  <h6>From here</h6>
                  <ul className="mapPanel__dist">
                    {namedPins.filter((p) => p.id !== selPin.id).map((p) => <li key={p.id}><span>{pinName(p)}</span><b>{fmtDist(map, dist(selPin, p))}</b></li>)}
                  </ul>
                </>
              )}
              <div className="mapPanel__row"><button type="button" onClick={removeSel}><FaTrash /> Remove</button></div>
            </div>
          )}
          {selLine && (
            <div className="mapPanel">
              <h5>Route</h5>
              <input placeholder="Name this route" value={selLine.name} onChange={(e) => save({ ...map, lines: map.lines.map((x) => (x.id === selLine.id ? { ...x, name: e.target.value } : x)) })} />
              <p className="mapPanel__title">{fmtDist(map, pathLength(selLine.points))} · {selLine.points.length} points</p>
              <label className="mapPanel__color">Colour <input type="color" value={selLine.color || "#e0245e"} onChange={(e) => save({ ...map, lines: map.lines.map((x) => (x.id === selLine.id ? { ...x, color: e.target.value } : x)) })} /></label>
              <div className="mapPanel__row"><button type="button" onClick={removeSel}><FaTrash /> Remove</button></div>
            </div>
          )}

          <h5>Places</h5>
          <SortRoles onDone={() => setTick((t) => t + 1)} />
          {locations.length === 0 && <p className="muted">No locations yet. On an element's page, mark it as a Location and it will appear here.</p>}
          <ul className="mapList">
            {locations.map((l) => {
              const pin = map.pins.find((p) => p.element === l.file);
              return (
                <li key={l.file} className={pin ? "is-pinned" : ""}>
                  <span>{l.icon} {l.name}</span>
                  {pin ? <button type="button" onClick={() => { setSel({ kind: "pin", id: pin.id }); setView((v) => { const r = svgRef.current.getBoundingClientRect(); return { ...v, x: r.width / 2 - pin.x * v.z, y: r.height / 2 - pin.y * v.z }; }); }}>show</button>
                    : <button type="button" className={pinFor === l.file ? "is-on" : ""} onClick={() => { setPinFor(l.file); setTool("pin"); }}>{pinFor === l.file ? "click the map…" : "pin"}</button>}
                </li>
              );
            })}
          </ul>
          {map.pins.some((p) => !p.element) && <p className="muted">{map.pins.filter((p) => !p.element).length} pin{map.pins.filter((p) => !p.element).length === 1 ? "" : "s"} not tied to a location.</p>}

          {map.lines.length > 0 && (
            <>
              <h5>Routes</h5>
              <ul className="mapList">
                {map.lines.map((l) => <li key={l.id}><span>{l.name || "Unnamed route"}</span><b>{fmtDist(map, pathLength(l.points))}</b></li>)}
              </ul>
            </>
          )}

          {namedPins.length > 1 && map.scale && (
            <>
              <h5>Distances</h5>
              <p className="muted">Straight line between every pinned place.</p>
              <ul className="mapPanel__dist">
                {namedPins.flatMap((a, i) => namedPins.slice(i + 1).map((b) => <li key={a.id + b.id}><span>{pinName(a)} → {pinName(b)}</span><b>{fmtDist(map, dist(a, b))}</b></li>)).slice(0, 40)}
              </ul>
            </>
          )}

          <div className="mapView__foot">
            <button type="button" className="danger" onClick={() => { if (window.confirm(`Delete the map “${map.name}”?`)) { deleteMap(dir, map.id); navigate("/elements"); } }}><FaTimes /> Delete map</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapView;
