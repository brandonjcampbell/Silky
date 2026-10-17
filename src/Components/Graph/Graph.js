import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Graph.css";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import cola from "cytoscape-cola";
import { readPalette, THEME_EVENT } from "../../theme";

const Graph = ({ elements, onDrop }) => {
  const defaultLayout = {
    name: "preset",
    maxSimulationTime: 2000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };
  //Cytoscape.use(cola);

  const [hide, setHide] = useState([]);
  const [layout, setLayout] = useState(defaultLayout);
  const [cy, setCy] = useState(null);
  const [repositionNodes, setRepositionNodes] = useState(true);
  const [showNodeText, setShowNodeText] = useState(true);
  const [showEdgeText, setShowEdgeText] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );
  const [palette, setPalette] = useState(readPalette);

  useEffect(() => {
    const onTheme = () => setPalette(readPalette());
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  useEffect(() => {
    if (cy) {
      if (repositionNodes) {
        cy.layout(layout).run();
      }
    }
  }, [hide]);

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCy = (cy) => {
    cy.one("dragfreeon", function (e) {
      let temp = e.target._private.data;
      temp.position = {
        x: e.target._private.position.x,
        y: e.target._private.position.y,
      };
      onDrop(temp);
    });
    setCy(cy);
  };

  // Fit once after the first layout settles so a web opens showing all of
  // its nodes, whatever screen it was laid out on. Stored positions are
  // untouched; only the viewport moves.
  useEffect(() => {
    if (!cy) return;
    const fit = () => cy.fit(undefined, 40);
    cy.one("layoutstop", fit);
    const t = setTimeout(fit, 150);
    return () => clearTimeout(t);
  }, [cy]);

  // The canvas fills whatever container it is given; the container decides
  // the size. We still listen for resizes so Cytoscape re-measures.
  function getWindowDimensions() {
    return { width: "100%", height: "100%" };
  }

  useEffect(() => {
    if (cy) cy.resize();
  }, [cy, windowDimensions]);

  return (
    <CytoscapeComponent
      layout={layout}
      cy={handleCy}
      elements={elements}
      style={{
        height: windowDimensions.height,
        width: windowDimensions.width,
      }}
      stylesheet={[
        {
          selector: "node",
          style: {
            height: showNodeText ? 100 : 15,
            width: showNodeText ? 100 : 15,
            backgroundColor: palette.bgRaised,
            "border-width": 1,
            "border-color": palette.line,
            label: showNodeText ? "data(label)" : "",
            "text-wrap": "wrap",
            "text-max-width": 100,
            "font-size": "12px",
            "text-halign": "center",
            "text-valign": "center",
            color: palette.ink,
            "text-outline-color": palette.bgRaised,
            "text-outline-width": 2,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": palette.inkMuted,
            "target-arrow-color": palette.inkMuted,
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            color: palette.ink,
            "text-outline-color": palette.bg,
            "text-outline-width": 2,
            "font-size": "12px",
            "edge-text-rotation": "autorotate",
            label: showEdgeText ? "data(label)" : "",
          },
        },
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
      ]}
    />
  );
};
export default Graph;
