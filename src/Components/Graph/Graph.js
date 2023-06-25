import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Graph.css";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import cola from "cytoscape-cola";

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

  function getWindowDimensions() {
    let { innerWidth: width, innerHeight: height } = window;

    let returnHeight = height - 70;
    let returnWidth = width;
    return {
      width: returnWidth,
      height: returnHeight,
    };
  }

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
            backgroundColor: "#333",
            label: showNodeText ? "data(label)" : "",
            "text-wrap": "wrap",
            "text-max-width": 100,
            "font-size": "12px",
            "text-halign": "center",
            "text-valign": "center",
            color: "white",
            "text-outline-color": "black",
            "text-outline-width": 2,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            color: "black",
            "text-outline-color": "white",
            "text-outline-width": 2,
            "font-size": "12px",
            "edge-text-rotation": "autorotate",
            label: showEdgeText ? "data(label)" : "",
          },
        },
        {
          selector: "node[hyper>0]",
          style: {
            color: "black",
            width: 25,
            height: 25,
            backgroundColor: "white",
            "text-outline-color": "white",
            "text-outline-width": 2,
          },
        },
      ]}
    />
  );
};
export default Graph;
