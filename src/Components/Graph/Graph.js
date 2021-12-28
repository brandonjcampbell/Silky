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

const Graph = ({ type }) => {
  const defaultLayout = {
    name: "cola",
    maxSimulationTime: 2000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };

  Cytoscape.use(COSEBilkent);
  Cytoscape.use(cola);
  Cytoscape.use(dagre);
  Cytoscape.use(fcose);
  Cytoscape.use(klay);
  Cytoscape.use(spread);
  Cytoscape.use(cise);
  Cytoscape.use(avsdf);

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
    setCy(cy);
  };

  const globalState = useContext(store);
  let axioms = [];

  globalState.state.actors
    .filter((x) => x.type === "thread")
    .map((thread) => {
      if (thread.sequence && !hide.includes(thread.uuid)) {
        for (let i = 1; i < thread.sequence.length; i++) {
          const source = thread.sequence[i - 1];
          const target = thread.sequence[i];
          const res = {
            data: {
              uuid: source.uuid + target.uuid + i,
              source: source.uuid,
              target: target.uuid,
              label: thread.name,
              arrow: "circle",
              color: thread.color ? thread.color : "#ccc",
            },
          };
          axioms.push(res);
        }
      }
    });

  const content = actorToCyto(
    globalState.state.actors.filter(
      (x) =>
        x.type === "snippet" &&
        x.type !== "thread" &&
        x.type != "web" &&
        (hideDisconnctedNodes === false || !hide.includes((y) => y === x.uuid))
    )
  );

  return (
    <div>
      <div>
        <div>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={layout.name}
            onChange={(e) => {
              let tempLayout = _.cloneDeep(layout);
              tempLayout.name = e.target.value;
              setLayout(tempLayout);
            }}
          >
            <MenuItem value="cola">Cola</MenuItem>
            <MenuItem value="cose-bilkent">COSEBilkent</MenuItem>
            <MenuItem value="dagre">Dagre</MenuItem>
            <MenuItem value="klay">Klay</MenuItem>
            <MenuItem value="fcose">Fcose</MenuItem>
            <MenuItem value="spread">Spread</MenuItem>
            <MenuItem value="cise">Cise</MenuItem>
            <MenuItem value="avsdf">avsdf</MenuItem>
          </Select>

          <div>
            <Checkbox
              defaultChecked
              style={{
                color: "#444",
              }}
              onClick={() => {
                setHideDisconnectedNodes(!hideDisconnctedNodes);
              }}
            />
            Hide disconnected nodes
          </div>
          <div>
            <Checkbox
              defaultChecked
              onClick={() => {
                setRepositionNodes(!repositionNodes);
              }}
            />
            Reposition nodes on change
          </div>
          <div>
            <Checkbox
              defaultChecked
              onClick={() => {
                setShowNodeText(!showNodeText);
              }}
            />
            Show Snippet Text
          </div>
          <div>
            <Checkbox
              defaultChecked
              onClick={() => {
                setShowEdgeText(!showEdgeText);
              }}
            />
            Show Thread Text
          </div>

          <Button
            variant="contained"
            onClick={() => {
              cy.center();
            }}
          >
            Center
          </Button>
          <Button variant="contained" onClick={() => cy.layout(layout).run()}>
            Reposition
          </Button>

          <h2>
            {" "}
            <LinearScaleIcon /> Threads
          </h2>

          {globalState.state.actors.map((x) => {
            if (x.type === "thread") {
              return (
                <div>
                  <Checkbox
                    value={x.name}
                    defaultChecked
                    style={{
                      color: x.color ? x.color : "#444",
                    }}
                    onClick={() => {
                      if (hide.includes(x.uuid)) {
                        setHide(hide.filter((y) => y !== x.uuid));
                      } else {
                        setHide([...hide, x.uuid]);
                      }
                    }}
                  />
                  {x.name}
                </div>
              );
            }
          })}
        </div>

        <div
          style={{
            height: windowDimensions.height,
            width: windowDimensions.width - 500,
          }}
        >
          <CytoscapeComponent
            layout={layout}
            cy={handleCy}
            elements={[
              ...content.filter(
                (x) =>
                  hideDisconnctedNodes === false ||
                  axioms.filter(
                    (y) =>
                      y.data.source === x.data.id || y.data.target === x.data.id
                  ).length > 0
              ),
              ...axioms,
            ]}
            style={{
              height: windowDimensions.height,
              width: windowDimensions.width - 200,
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
      </div>
    </div>
  );
};

export default Graph;
