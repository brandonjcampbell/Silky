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
import FormDialog from "../FormDialog/";
import { actorToCyto } from "../../utils";
import contextMenus from "cytoscape-context-menus";
import remove from "../../utils/remove";
import "cytoscape-context-menus/cytoscape-context-menus.css";

import _ from "lodash";

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

  const defaultLayout = {
    name: "dagre",
    maxSimulationTime: 200000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };

  const [showNodeText, setShowNodeText] = useState(true);
  const [showEdgeText, setShowEdgeText] = useState(true);
  const [addNodeFlag, setAddNodeFlag] = useState(false);
  const [mostRecentId, setMostRecentId] = useState(false);
  const [mouseX, setMouseX] = useState(false);
  const [mouseY, setMouseY] = useState(false);

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

  useEffect(() => {
    refetch();
    recalibrate();
  }, [globalState.state.actors]);

  const handleCy = (cy) => {
    var options = {
      evtType: "cxttap",
      menuItems: [
        // {
        //   id: "log-id",
        //   content: "log id",
        //   tooltipText: "link to",
        //   image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
        //   selector: "node",
        //   coreAsWell: false,
        //   onClickFunction: function (e) {
        //     console.log(e, cy.getElementById(e.target._private.data.id).position());
        //   },
        // },
        {
          id: "delete-node",
          content: "Delete",
          tooltipText: "delete",
          image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
          selector: "node,link",
          coreAsWell: false,
          onClickFunction: function (e) {
            console.log(e)
            const actor = globalState.state.actors.find((x) => x.uuid === e.target._private.data.id);
            if (actor) {
              console.log("waht?", e)
              remove(actor,dispatch,()=>{
                refetch();
                recalibrate();
              });
            }
          },
        },
        {
          id: "add-fact",
          content: "Add Fact",
          tooltipText: "link to",
          image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
          selector: "",
          coreAsWell: true,
          onClickFunction: function (e) {
            setAddNodeFlag(true);
            console.log(e, "Check it out now");
            setMouseX(e.position.x);
            setMouseY(e.position.y);
            console.log("Partaaaay");
          },
        },
        {
          id: "add-link",
          content: "CAUSES",
          tooltipText: "link to",
          image: { src: "add.svg", width: 12, height: 12, x: 6, y: 4 },
          selector: "node",
          coreAsWell: false,
          onClickFunction: function (e) {
            if (e.target._private.data.id) {
              if (linking) {
                const unpack = JSON.parse(linking);
                let link;

                if (
                  !(
                    (unpack && unpack.data && unpack.data.label === "CAUSES") ||
                    e.target._private.data.label === "CAUSES"
                  )
                ) {
                  handleAdd({
                    name: "CAUSES",
                    subjects: [unpack.data.id ],
                    targets: [ e.target._private.data.id ],
                  });
                }
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
                cy.$("#" + e.target._private.data.id).addClass("foo");
              }
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

    if (node.type==="link" && node.name==="CAUSES" && node.targets) {
      node.targets.forEach((f) => {
        const res = {
          data: {
            source: node.subjects[0],
            target: f,
            id: node.uuid,
            label: "CAUSES",
            arrow: "none",
            color: node.color ? node.color : "#ccc",
          },
        };
        axioms.push(res);
      });
    }
  });

  const refetch = function () {
    let val = actorToCyto(
      globalState.state.actors.filter((a) => a.type === "fact")
    );

    if (mostRecentId) {
      console.log();
      const record = val.find((x) => x.data.id === mostRecentId);
      record.position = { x: mouseX, y: mouseY };
    }

    return val;
  };

  const content = refetch();

  const recalibrate = function () {
    setElements([...content, ...axioms]);
  };

  const [elements, setElements] = useState([...content, ...axioms]);

  const handleAdd = (newObject) => {
    dispatch({
      action: "add",
      for: "link",
      class: "actor",
      payload: newObject,
      callback: (e) => {
        console.log(e);
        setMostRecentId(e);
        refetch();
        recalibrate();
      },
    });
  };

  return (
    <div>
      {mostRecentId} - {mouseX} , {mouseY}
      {
        <FormDialog
          type={"fact"}
          button={false}
          passOpen={addNodeFlag}
          specialOp={(e) => {
            setMostRecentId(e);
          }}
          handleCloseExtra={(newFact) => {
            setAddNodeFlag(false);
          }}
        />
      }
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
