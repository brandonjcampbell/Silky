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
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import { confirmAlert } from "react-confirm-alert"; // Import
import contextMenus from "cytoscape-context-menus";
import "cytoscape-context-menus/cytoscape-context-menus.css";
//import options from "./contextMenuOptions";

import _ from "lodash";
import TitleBar from "../TitleBar";

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

  if (!Cytoscape("core", "contextMenus")) {
    Cytoscape.use(contextMenus);
  }

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
  const [linking, setLinking] = useState(false);
  useEffect(() => {
    if (cy) {
      cy.layout(defaultLayout).run();
      cy.center();
    }
  }, [actor.layout]);

  useEffect(() => {
    if (cy) {
      if (actor.repositionNodes) {
        cy.layout(defaultLayout).run();
        cy.center();
      }
    }
  }, [
    actor.show,
    actor.showAxiom,
    actor.repositionNodes,
    actor.hideDisconnectedNodes,
  ]);

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

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const saveTitle = () => {
    setEditTitle(false);
    let clone = _.cloneDeep(actor);
    clone.name = title;
    dispatch({
      action: "saveActor",
      for: "web",
      payload: { actor: clone },
    });
  };

  function isValid (testId){
    if(globalState.state.actors.find(x=>x.uuid===testId) && actor.show.find(x=>x===testId)){
    return true
    }
    else return false
  }


  let axioms = [];

  globalState.state.actors.map((node) => {


    if (node.type==="link" && node.targets && node.subjects) {
      node.targets.forEach((f) => {
        const res = {
          data: {
            source: node.subjects[0],
            target: f,
            id: node.uuid,
            label: node.name,
            color: node.color ? node.color : "#ccc",
          },
        };
        if(isValid(res.data.source) && isValid(res.data.target)){
          axioms.push(res);
        }
      });
    }
   

    //Thread Sequence
    if (
      actor.showAxiom &&
      actor.showAxiom.includes("thread") &&
      actor.thread &&
      actor.thread.map((x) => x.uuid).includes(node.uuid) &&
      node.type == "thread" &&
      node.sequence
    ) {
      for (let i = 1; i < node.sequence.length; i++) {
        const source = node.sequence[i - 1];
        const target = node.sequence[i];
        if (
          actor.show.includes(source.uuid) &&
          actor.show.includes(target.uuid)
        ) {
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
          if(isValid(res.data.source) && isValid(res.data.target)){
            axioms.push(res);
          }
        }
      }
    }
  });

  // const content = actorToCyto(
  //   globalState.state.actors
  //     .filter((a) => a.type !== "web" && a.type !== "thread" && a.type !== "link" && (actor.show.includes(a.uuid)))     
  // )

  
  const content = actorToCyto(
    globalState.state.actors
      .filter((a) =>(actor.show.includes(a.uuid)))     
  )

  const [elements, setElements] = useState([
     ...content,
     ...axioms,
  ]);

  return (
    <div>
      <TitleBar actor={actor} />
      <CytoscapeComponent
        layout={layout}
        cy={handleCy}
        elements={elements}
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
            selector: ".foo",
            style: {
              backgroundColor: "red",
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
