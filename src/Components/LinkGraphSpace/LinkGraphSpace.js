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

const LinkGraphSpace = ({ showAvatar, type }) => {
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

  const defaultLayout = {
    name: "dagre",
    maxSimulationTime: 200000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };

  const [showNodeText, setShowNodeText] = useState(true);
  const [showEdgeText, setShowEdgeText] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );
  const [layout, setLayout] = useState(defaultLayout);
  const [cy, setCy] = useState(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCy = (cy) => {
    var options = {
      evtType: "cxttap",
      menuItems: [
        {
          id: "add-link",
          content: "causes",
          tooltipText: "link to",
          image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
          selector: "node",
          coreAsWell: true,
          onClickFunction: function (e) {
            console.log("WHHERE?", linking);
            if (linking) {
              const unpack = JSON.parse(linking);
              let link;

              if (
                (unpack && unpack.data && unpack.data.label === "CAUSES") ||
                e.target._private.data.label === "CAUSES"
              ) {
                console.log(link);
                const res = {
                  data: {
                    uuid:
                      unpack.data.id +
                      e.target._private.data.id +
                      100 * Math.random(),
                    source: unpack.data.id,
                    target: e.target._private.data.id,
                    linkLeader: e.target._private.data.label === "CAUSES" ? "true":false,
                    label: "",
                    arrow: "circle",
                    color: "#ccc",
                  },
                };

                axioms.push(res);
              } else {
                link = {
                  data: {
                    id:
                      unpack.data.id +
                      e.target._private.data.id +
                      100 * Math.random(),
                    name: "CAUSES",
                    label: "CAUSES",
                  },
                  position: {
                    x: (unpack.position.x + e.target._private.position.x) / 2,
                    y: (unpack.position.y + e.target._private.position.y) / 2,
                  },
                };

                console.log(link);
                const res1 = {
                  data: {
                    uuid:
                      unpack.data.id +
                      e.target._private.data.id +
                      100 * Math.random(),
                    source: link.data.id,
                    target: e.target._private.data.id,
                    label: "",
             
                    arrow: "circle",
                    color: "#ccc",
                  },
                };

                const res2 = {
                  data: {
                    uuid:
                      unpack.data.id +
                      e.target._private.data.id +
                      1000 * Math.random(),
                    source: unpack.data.id,
                    target: link.data.id,
                    linkLeader:"true",
                    label: "",
                    arrow: "circle",
                    color: "#ccc",
                  },
                };

                axioms.push(res1);
                axioms.push(res2);
                content.push(link);
              }

              recalibrate();
              cy.$("#" + unpack.data.id).removeClass("foo");
              setLinking(false);
            } else {
              console.log(e.target._private);

              setLinking(
                JSON.stringify({
                  data: e.target._private.data,
                  position: e.target._private.position,
                })
              );
              //console.log(linking,"OOOOGH")
              cy.$("#" + e.target._private.data.id).addClass("foo");
            }
          },
        },
      ],
      menuItemClasses: [],
      contextMenuClasses: [],
      submenuIndicator: {
        src: "assets/submenu-indicator-default.svg",
        width: 12,
        height: 12,
      },
    };

    var instance = cy.contextMenus(options);

    setCy(cy);
  };



  let axioms = [];

  globalState.state.actors.map((node) => {
    // This BECAUSE That

    if(node.subjects){
    node.subjects.forEach((f) => {

        const res = {
          data: {
            uuid: node.uuid + node.uuid,
            source: node.uuid,
            target: f.uuid,
            label: "",
           
            arrow: "circle",
            color: node.color ? node.color : "#ccc",
          },
        };
        axioms.push(res);
      
    });}
    if(node.targets){
    node.targets.forEach((f) => {

        const res = {
          data: {
            uuid: node.uuid + node.uuid,
            target: node.uuid,
            source: f.uuid,
            label: "",
            linkLeader:'true',
            arrow: "none",
            color: node.color ? node.color : "#ccc",
          },
        };
        axioms.push(res);
      
    });}
  });

  const content = actorToCyto(
    globalState.state.actors
      .filter((a) => a.type === "fact" || a.type==="link")
      .map((a) => {
        if (a.type === "link") {
          let temp = _.cloneDeep(a);
          temp.name = "CAUSES";
          return temp;
        } else {
          return a;
        }
      })
  );

  const recalibrate = function () {
    setElements([
      ...content,
      ...axioms,
    ]);
  };

  const [elements, setElements] = useState([
    ...content,
    ...axioms,
  ]);

  return (
    <div>
      <CytoscapeComponent
        layout={layout}
        cy={handleCy}
        elements={elements}
        style={{
          height: windowDimensions.height + 20,
          width: windowDimensions.width,
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
            selector: "node[label='CAUSES']",
            style: {
              color: "black",
              width: 30,
              height: 30,
              backgroundColor: "white",
              "text-outline-color": "white",
              "text-outline-width": 2,
            },
          },
          {
            selector: "edge[linkLeader='true']",
            style: {
   
              "target-arrow-shape": "none",
             
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

export default LinkGraphSpace;
