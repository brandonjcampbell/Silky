import React from "react";
import Cytoscape from "cytoscape";
import { store } from "../../MyContext";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
import klay from "cytoscape-klay";
import spread from "cytoscape-spread";
import cise from "cytoscape-cise";
import avsdf from "cytoscape-avsdf";
import { actorToCyto } from "../../utils";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import _ from "lodash";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import { useState, useContext, useEffect } from "react";

function getWindowDimensions() {
  let { innerWidth: width, innerHeight: height } = window;

  let returnHeight = height - 70;
  let returnWidth = width;
  return {
    width: returnWidth,
    height: returnHeight,
  };
}

const GraphSpace = ({ actorUuid, showAvatar, type }) => {
  Cytoscape.use(COSEBilkent);
  Cytoscape.use(cola);
  Cytoscape.use(dagre);
  Cytoscape.use(fcose);
  Cytoscape.use(klay);
  Cytoscape.use(spread);
  Cytoscape.use(cise);
  Cytoscape.use(avsdf);

  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);

  const defaultLayout = {
    name: actor.layout ? actor.layout : "cola",
    maxSimulationTime: 2000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };
  const [hide, setHide] = useState([]);
  const [hideDisconnctedNodes, setHideDisconnectedNodes] = useState(true);
  const [repositionNodes, setRepositionNodes] = useState(true);
  const [showNodeText, setShowNodeText] = useState(true);
  const [showEdgeText, setShowEdgeText] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );
  const [layout, setLayout] = useState(defaultLayout);
  const [cy, setCy] = useState(null);

  useEffect(() => {
    console.log(cy);
    if (cy) {
      cy.layout(defaultLayout).run();
    }
  }, [actor.layout]);

  useEffect(() => {
    if (cy) {
      if (actor.repositionNodes) {
        cy.layout(layout).run();
      }
    }
  }, [actor.repositionNodes]);

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCy = (cy) => {
    setCy(cy);
  };

  let axioms = [];

  globalState.state.actors
    .map((node) => {
      // REVEALS

      if (
        actor.showAxiom && 
        actor.showAxiom.includes("reveals") &&
        node.type === "snippet" &&
        node.facts &&
        node.facts.length > 0 &&
        actor.show

      ) {
        node.facts.forEach((f) => {
          if (actor.show.find((a) => a === node.uuid) && actor.show.find((a) => a === f.uuid)) {
            const res = {
              data: {
                uuid: node.uuid + node.uuid,
                source: node.uuid,
                target: f.uuid,
                label: "REVEALS",
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        });
      }

      // INVOLVED IN
      if (
        actor.showAxiom && 
        actor.showAxiom.includes("involvedIn") &&
        node.type !== "snippet" &&
        node.facts &&
        node.facts.length > 0 &&
        actor.show

      ) {
        node.facts.forEach((f) => {
          if (actor.show.find((a) => a === node.uuid) && actor.show.find((a) => a === f.uuid)) {
            const res = {
              data: {
                uuid: node.uuid + node.uuid,
                source: node.uuid,
                target: f.uuid,
                label: "INVOLVED IN",
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        });
      }

      // This BECAUSE That
      if (
        actor.showAxiom && 
        actor.showAxiom.includes("because") &&
        node.subjects &&
        node.subjects.length > 0 &&
        node.targets &&
        node.targets.length > 0 &&
        actor.show

      ) {
        node.subjects.forEach((f) => {
          if (actor.show.find((a) => a === node.uuid) && actor.show.find((a) => a === f.uuid)) {
            const res = {
              data: {
                uuid: node.uuid + node.uuid,
                source: node.uuid,
                target: f.uuid,
                label: "THIS",
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        });
        node.targets.forEach((f) => {
          if (actor.show.find((a) => a === node.uuid) && actor.show.find((a) => a === f.uuid)) {
            const res = {
              data: {
                uuid: node.uuid + node.uuid,
                source: node.uuid,
                target: f.uuid,
                label: "THAT",
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        });
      }

      // x INVOLVES element
      if (
        actor.showAxiom && 
        actor.showAxiom.includes("involves") &&
        node.elements &&
        node.elements.length > 0 &&
        actor.show

      ) {
        node.elements.forEach((f) => {
          if (actor.show.find((a) => a === node.uuid) && actor.show.find((a) => a === f.uuid)) {
            const res = {
              data: {
                uuid: node.uuid + node.uuid,
                source: node.uuid,
                target: f.uuid,
                label: "INVOLVES",
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        });
      }

      //Thread Sequence
      if (
        actor.showAxiom && 
        actor.showAxiom.includes("thread") &&
        node.type == "thread" &&
        node.sequence 
      ) {
        for (let i = 1; i < node.sequence.length; i++) {
          const source = node.sequence[i - 1];
          const target = node.sequence[i];
          if (actor.show.includes(source.uuid) && actor.show.includes(target.uuid)) {
            const res = {
              data: {
                uuid: source.uuid + target.uuid + i,
                source: source.uuid,
                target: target.uuid,
                label: node.name,
                arrow: "circle",
                color: node.color ? node.color : "#ccc",
              },
            };
            axioms.push(res);
          }
        }
      }
    });

  const content = actorToCyto(
    globalState.state.actors
      .filter((a) => a.type !== "web" && a.type !== "thread")
      .filter((a) => actor.show && actor.show.includes(a.uuid))
      .map((a) => {
        if (a.type === "link") {
          let temp = _.cloneDeep(a);
          temp.name = "BECAUSE";
          return temp;
        } else {
          return a;
        }
      })
  );

  return (
    <div>
      <h1>
        {actor.name} - {actor.layout && actor.layout}
      </h1>

      <CytoscapeComponent
        layout={layout}
        cy={handleCy}
        elements={[...content, ...axioms]}
        style={{
          height: windowDimensions.height + 20,
          width: windowDimensions.width - 400,
        }}
        stylesheet={[
          {
            selector: "node",
            style: {
              height: showNodeText ? 100 : 15,
              width: showNodeText ? 100 : 15,
              shape: "circle",
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
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              color: "black",
              "text-outline-color": "data(color)",
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
    </div>
  );
};

export default GraphSpace;
