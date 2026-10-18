import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Graph.css";
import CytoscapeComponent from "react-cytoscapejs";
import { FaCompress, FaSave, FaFont, FaTag, FaAtom } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { readPalette, THEME_EVENT } from "../../theme";
import ForceGraph from "./ForceGraph";
import NodeDetails from "./NodeDetails";
import { GROUP_COLORS } from "../WebAnalysis/WebAnalysis";

const PHYSICS_KEY = "silky:graph-physics";

/**
 * Layouts offered in the toolbar. "Saved" uses the positions stored on the
 * web; the others are computed. Big webs get fewer iterations so the force
 * layout stays responsive.
 */
const LAYOUTS = [
  { id: "preset", name: "Saved positions", make: () => ({ name: "preset", fit: true, padding: 40 }) },
  {
    id: "cose",
    name: "Force",
    make: (n) => ({
      name: "cose",
      fit: true,
      padding: 40,
      animate: false,
      randomize: true,
      numIter: n > 400 ? 300 : 1000,
      nodeRepulsion: () => 200000,
      idealEdgeLength: () => 120,
      edgeElasticity: () => 100,
      gravity: 0.6,
      nodeDimensionsIncludeLabels: true,
    }),
  },
  {
    id: "concentric",
    name: "Concentric by links",
    make: () => ({
      name: "concentric",
      fit: true,
      padding: 40,
      animate: false,
      minNodeSpacing: 30,
      concentric: (node) => node.degree(),
      levelWidth: () => 2,
      nodeDimensionsIncludeLabels: true,
    }),
  },
  {
    id: "breadthfirst",
    name: "Tree",
    make: () => ({ name: "breadthfirst", fit: true, padding: 40, animate: false, directed: true, spacingFactor: 1.1, nodeDimensionsIncludeLabels: true }),
  },
  { id: "circle", name: "Circle", make: () => ({ name: "circle", fit: true, padding: 40, animate: false, nodeDimensionsIncludeLabels: true }) },
  { id: "grid", name: "Grid", make: () => ({ name: "grid", fit: true, padding: 40, animate: false, nodeDimensionsIncludeLabels: true }) },
];

const SHAPE = { element: "ellipse", fact: "round-rectangle", snippet: "rectangle", thread: "diamond", web: "hexagon" };

const Graph = ({ elements, onDrop, onPositions, lookup, groups }) => {
  const groupOf = useMemo(() => { const m = new Map(); (groups || []).forEach((g, i) => g.forEach((id) => m.set(id, i))); return m; }, [groups]);
  const [cy, setCy] = useState(null);
  const navigate = useNavigate();
  const [physics, setPhysics] = useState(() => { try { return localStorage.getItem(PHYSICS_KEY) === "1"; } catch (e) { return false; } });
  const [selected, setSelected] = useState(null);
  const forceRef = useRef(null);
  const [layoutId, setLayoutId] = useState("preset");
  const [showNodeText, setShowNodeText] = useState(true);
  const [showEdgeText, setShowEdgeText] = useState(true);
  const [palette, setPalette] = useState(readPalette);
  const [dirty, setDirty] = useState(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const nodeCount = elements.filter((e) => !e.data.source).length;
  const big = nodeCount > 150;

  useEffect(() => {
    const onTheme = () => setPalette(readPalette());
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  // Hide labels by default on crowded webs; the toggle brings them back.
  useEffect(() => {
    if (big) {
      setShowNodeText(false);
      setShowEdgeText(false);
    }
  }, [big]);

  const handleCy = (instance) => {
    if (cy === instance) return;
    instance.on("dragfreeon", "node", (e) => {
      const n = e.target;
      onDropRef.current && onDropRef.current({ id: n.id(), position: { ...n.position() } });
    });
    instance.on("tap", (e) => { if (e.target === instance) setSelected(null); });
    instance.on("tap", "node", (e) => setSelected(e.target.id()));
    instance.on("dbltap", "node", (e) => navigate("/elements/" + e.target.id()));
    setCy(instance);
  };
  const togglePhysics = () => setPhysics((p) => { try { localStorage.setItem(PHYSICS_KEY, p ? "0" : "1"); } catch (e) { /* */ } return !p; });

  // Run the chosen layout whenever it changes (or the graph mounts).
  useEffect(() => {
    if (!cy) return;
    const def = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0];
    const lay = cy.layout(def.make(nodeCount));
    lay.run();
    setDirty(layoutId !== "preset");
    const t = setTimeout(() => cy.fit(undefined, 40), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, layoutId]);

  useEffect(() => {
    if (!cy) return;
    const onResize = () => cy.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cy]);

  const savePositions = () => {
    if (!onPositions) return;
    let pos = {};
    if (physics && forceRef.current) pos = forceRef.current.positions();
    else if (cy) cy.nodes().forEach((n) => { pos[n.id()] = { ...n.position() }; });
    else return;
    onPositions(pos);
    setDirty(false);
    setLayoutId("preset");
  };

  // graph data for the physics view, and the neighbourhood of the selection
  const fNodes = elements.filter((e) => !e.data.source).map((e) => ({ id: e.data.id, name: e.data.name || String(e.data.label || "").replace(/^\S+\s/, ""), icon: e.data.icon || "", type: e.data.type, x: e.position && e.position.x, y: e.position && e.position.y, color: groupOf.has(e.data.id) ? GROUP_COLORS[groupOf.get(e.data.id) % GROUP_COLORS.length] : null }));
  const cyElements = groups ? elements.map((e) => (e.data.source || !groupOf.has(e.data.id) ? e : { ...e, data: { ...e.data, group: groupOf.get(e.data.id) % GROUP_COLORS.length } })) : elements;
  const fLinks = elements.filter((e) => e.data.source).map((e) => ({ source: e.data.source, target: e.data.target, label: e.data.label, kind: e.data.kind }));
  const selActor = selected && lookup ? lookup(selected) : null;
  const neighbours = selected && lookup
    ? fLinks.filter((l) => l.source === selected || l.target === selected).map((l) => { const other = l.source === selected ? l.target : l.source; const a = lookup(other); return a ? { actor: a, label: l.source === selected ? l.label : "← " + l.label } : null; }).filter(Boolean)
    : [];

  const nodeSize = showNodeText ? (big ? 70 : 100) : 14;

  return (
    <div className="graph">
      <div className="graph__tools" role="toolbar" aria-label="Graph layout">
        <select value={layoutId} onChange={(e) => setLayoutId(e.target.value)} title="Layout" disabled={physics}>
          {LAYOUTS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" className={physics ? "is-on" : ""} title="Physics — a live force simulation; drag nodes and the rest follows" aria-pressed={physics} onClick={togglePhysics}><FaAtom /> Physics</button>
        <button type="button" title="Fit to view" onClick={() => (physics ? forceRef.current && forceRef.current.fit() : cy && cy.fit(undefined, 40))}><FaCompress /></button>
        <button type="button" className={showNodeText ? "is-on" : ""} title="Node labels" aria-pressed={showNodeText} onClick={() => setShowNodeText((v) => !v)}><FaFont /></button>
        <button type="button" className={showEdgeText ? "is-on" : ""} title="Edge labels" aria-pressed={showEdgeText} onClick={() => setShowEdgeText((v) => !v)}><FaTag /></button>
        {onPositions && (
          <button type="button" className={dirty || physics ? "is-accent" : ""} title="Save these positions to the web" onClick={savePositions} disabled={!physics && !dirty && layoutId === "preset"}>
            <FaSave /> {dirty || physics ? "Save layout" : "Saved"}
          </button>
        )}
        <span className="graph__count">{nodeCount.toLocaleString()} nodes</span>
      </div>
      {selActor && <NodeDetails actor={selActor} neighbours={neighbours} onPick={setSelected} onClose={() => setSelected(null)} />}
      {physics ? (
        <ForceGraph ref={forceRef} nodes={fNodes} links={fLinks} selected={selected} onSelect={setSelected} onOpen={(id) => navigate("/elements/" + id)} showNodeText={showNodeText} showEdgeText={showEdgeText} />
      ) : (
      <CytoscapeComponent
        cy={handleCy}
        elements={cyElements}
        style={{ width: "100%", height: "100%" }}
        minZoom={0.05}
        maxZoom={4}
        wheelSensitivity={0.3}
        stylesheet={[
          {
            selector: "node",
            style: {
              height: nodeSize,
              width: nodeSize,
              backgroundColor: palette.bgRaised,
              "border-width": 1,
              "border-color": palette.line,
              label: showNodeText ? "data(label)" : "",
              "text-wrap": "wrap",
              "text-max-width": nodeSize,
              "font-size": big ? "10px" : "12px",
              "text-halign": "center",
              "text-valign": "center",
              color: palette.ink,
              "text-outline-color": palette.bgRaised,
              "text-outline-width": 2,
            },
          },
          ...Object.entries(SHAPE).map(([type, shape]) => ({ selector: `node[type='${type}']`, style: { shape } })),
          { selector: "node[type='snippet']", style: { "border-color": palette.inkMuted } },
          { selector: "node[type='thread']", style: { "border-color": palette.accent, "border-width": 2 } },
          {
            selector: "edge",
            style: {
              width: big ? 1 : 2,
              "line-color": palette.inkMuted,
              "target-arrow-color": palette.inkMuted,
              "target-arrow-shape": "triangle",
              "arrow-scale": big ? 0.6 : 1,
              "curve-style": big ? "straight" : "bezier",
              color: palette.ink,
              "text-outline-color": palette.bg,
              "text-outline-width": 2,
              "font-size": "11px",
              "edge-text-rotation": "autorotate",
              label: showEdgeText ? "data(label)" : "",
            },
          },
          { selector: "edge[kind='then']", style: { "line-color": palette.accent, "target-arrow-color": palette.accent } },
          {
            selector: "node[hyper>0]",
            style: {
              color: palette.bg,
              width: 25,
              height: 25,
              backgroundColor: palette.accent,
              "text-outline-color": palette.accent,
              "text-outline-width": 2,
            },
          },
          ...GROUP_COLORS.map((c, i) => ({ selector: `node[group = ${i}]`, style: { "border-color": c, "border-width": 3, backgroundColor: c + "33" } })),
          { selector: "node:selected", style: { "border-color": palette.accent, "border-width": 3 } },
        ]}
      />
      )}
    </div>
  );
};
export default Graph;
