import React, { useEffect, useRef, useState } from "react";
import "./Graph.css";
import CytoscapeComponent from "react-cytoscapejs";
import { FaCompress, FaSave, FaFont, FaTag } from "react-icons/fa";
import { readPalette, THEME_EVENT } from "../../theme";

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

const Graph = ({ elements, onDrop, onPositions }) => {
  const [cy, setCy] = useState(null);
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
    setCy(instance);
  };

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
    if (!cy || !onPositions) return;
    const pos = {};
    cy.nodes().forEach((n) => {
      pos[n.id()] = { ...n.position() };
    });
    onPositions(pos);
    setDirty(false);
    setLayoutId("preset");
  };

  const nodeSize = showNodeText ? (big ? 70 : 100) : 14;

  return (
    <div className="graph">
      <div className="graph__tools" role="toolbar" aria-label="Graph layout">
        <select value={layoutId} onChange={(e) => setLayoutId(e.target.value)} title="Layout">
          {LAYOUTS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" title="Fit to view" onClick={() => cy && cy.fit(undefined, 40)}><FaCompress /></button>
        <button type="button" className={showNodeText ? "is-on" : ""} title="Node labels" aria-pressed={showNodeText} onClick={() => setShowNodeText((v) => !v)}><FaFont /></button>
        <button type="button" className={showEdgeText ? "is-on" : ""} title="Edge labels" aria-pressed={showEdgeText} onClick={() => setShowEdgeText((v) => !v)}><FaTag /></button>
        {onPositions && (
          <button type="button" className={dirty ? "is-accent" : ""} title="Save these positions to the web" onClick={savePositions} disabled={!dirty && layoutId === "preset"}>
            <FaSave /> {dirty ? "Save layout" : "Saved"}
          </button>
        )}
        <span className="graph__count">{nodeCount.toLocaleString()} nodes</span>
      </div>
      <CytoscapeComponent
        cy={handleCy}
        elements={elements}
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
          { selector: "node:selected", style: { "border-color": palette.accent, "border-width": 3 } },
        ]}
      />
    </div>
  );
};
export default Graph;
