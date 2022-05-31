import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@material-ui/core/Chip";
import TabPanel from "../TabPanel";
import SimpleList from "../SimpleList";
import FormDialog from "../FormDialog";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";

import FormControl from "@material-ui/core/FormControl";
import { getDisplayName } from "../../utils";
import Autocomplete from "@mui/material/Autocomplete";
import "./GraphTabs.css";

import { TiScissors } from "react-icons/ti";
import { GiLightBulb, GiSettingsKnobs } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import { AiFillTag } from "react-icons/ai";

const homedir = window.require("os").homedir();
const useStyles = makeStyles({
  root: {
    background: "#333",
    color: "white",
    width: "200px",
    padding: "5px",
    margin: "5px",
  },
  subSection: {
    color: "white",
  },
  p: {
    color: "#777",
  },
  link: {
    "text-decoration": "none",
    color: "#777",
  },
});
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}
const GraphTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

  const defaultLayout = {
    name: "cola",
    maxSimulationTime: 2000,
    fit: false,
    nodeDimensionsIncludeLabels: true,
    refresh: 1,
  };

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  if (!actor.types) {
    actor.types = [];
  }
  console.log(actor);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  const [layout, setLayout] = useState(defaultLayout);

  const save = () => {
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  const tagSave = (newTags) => {
    actor.tags = newTags;
    setTags(newTags);
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  const getThreads = () => {
    const snippets = globalState.state.actors
      .filter(
        (snippet) =>
          snippet.type === "snippet" &&
          snippet.facts &&
          snippet.facts
            .map((y) => {
              return y.uuid;
            })
            .includes(actor.uuid)
      )
      .map((y) => y.uuid);

    const threads = globalState.state.actors.filter(
      (thread) =>
        thread.type === "thread" &&
        thread.sequence &&
        thread.sequence.filter((z) => {
          return snippets.includes(z.uuid);
        }).length > 0
    );

    return _.uniqBy(threads, "uuid");
  };

  function addTo(uuid, prop, type) {
    let el = globalState.state.actors.filter((x) => x.uuid === uuid)[0];
    let clone = _.cloneDeep(el);
    if (!clone[prop]) {
      clone[prop] = [];
    }
    clone[prop].push({ uuid: actor.uuid });
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: clone },
    });
  }

  function removeFrom(uuid, prop, type) {
    let el = globalState.state.actors.filter((x) => x.uuid === uuid)[0];

    let clone = _.cloneDeep(el);
    if (!clone[prop]) {
      clone[prop] = [];
    }
    clone[prop] = clone[prop].filter((x) => x.uuid !== actor.uuid);
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: clone },
    });
  }

  function addToLinks(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts.push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "fact",
      payload: { actor: clone },
    });
  }

  function removeFromLinks(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts = clone.facts.filter((x) => x.uuid !== uuid);
    dispatch({
      action: "saveActor",
      for: "fact",
      payload: { actor: clone },
    });
  }

  function includeType(typeToInclude) {
    if (!actor.show) {
      actor.show = [];
    }
    actor.show = [
      ...actor.show,
      ...globalState.state.actors
        .filter((x) => x.type === typeToInclude)
        .map((x) => {
          return x.uuid;
        }),
    ];
    save();
  }

  function removeType(typeToRemove) {
    if (!actor.show) {
      actor.show = [];
    }
    actor.show = actor.show.filter((x) => {
      if (globalState.state.actors.find((y) => y.uuid=== x && y.type !== typeToRemove))
        return true;
      else return false;
    });
    save();
  }

  function includeAxiomByType(typeToInclude) {
    if (!actor.showAxiom) {
      actor.showAxiom = [];
    }
    actor.showAxiom.push(typeToInclude)
    save();
  }

  function removeAxiomByType(typeToRemove) {
    if (!actor.showAxiom) {
      actor.showAxiom = [];
    }
    actor.showAxiom = actor.showAxiom.filter((x) => 
      x!==typeToRemove
    );
    save();
  }

  return (
    <div>
      {actor && (
        <div>
          <Box>
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => {
                setCurrentTab(newValue);
              }}
              aria-label="basic tabs example"
            >
              <Tab
                label={<GiSettingsKnobs className="menuItem" />}
                {...a11yProps(0)}
              />
            </Tabs>
          </Box>
          <TabPanel value={currentTab} index={0}>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={actor.layout}
              onChange={(e) => {
                actor.layout = e.target.value;

                save();
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
                style={{
                  color: "#444",
                }}
                onClick={() => {
                  actor.hideDisconnectedNodes = !actor.hideDisconnectedNodes;
                  save();
                }}
              />
              Hide disconnected nodes
            </div>
            <div>
              <Checkbox
                onClick={() => {
                  actor.repositionNodes = !actor.repositionNodes;
                  save();
                }}
              />
              Reposition nodes on change
            </div>

            <div>
              <Checkbox
                onClick={() => {
                  includeType("thread");
                }}
              />
              Threads!
            </div>

            <div>
              <Button
                onClick={() => {
                  includeType("element");
                }}
              >
                Include Elements{" "}
              </Button>

              <Button
                onClick={() => {
                  removeType("element");
                }}
              >
                Remove Elements{" "}
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  includeType("fact");
                }}
              >
                Include Facts{" "}
              </Button>

              <Button
                onClick={() => {
                  removeType("fact");
                }}
              >
                Remove Facts{" "}
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  includeType("link");
                }}
              >
                Include Links{" "}
              </Button>

              <Button
                onClick={() => {
                  removeType("link");
                }}
              >
                Remove Links{" "}
              </Button>
            </div>

     
            <div>
              <Button
                onClick={() => {
                  includeType("snippet");
                }}
              >
                Include Snippets{" "}
              </Button>

              <Button
                onClick={() => {
                  removeType("snippet");
                }}
              >
                Remove Snippets{" "}
              </Button>
            </div>


            
     

     RELATIONSHIPS

     <div>
              <Button
                onClick={() => {
                  includeAxiomByType("reveals");
                }}
              >
                Include REVEALS{" "}
              </Button>

              <Button
                onClick={() => {
                  removeAxiomByType("reveals");
                }}
              >
                Remove REVEALS{" "}
              </Button>
            </div>


            <div>
              <Button
                onClick={() => {
                  includeAxiomByType("because");
                }}
              >
                Include BECAUSE{" "}
              </Button>

              <Button
                onClick={() => {
                  removeAxiomByType("because");
                }}
              >
                Remove BECAUSE{" "}
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  includeAxiomByType("involves");
                }}
              >
                Include INVOLVES{" "}
              </Button>

              <Button
                onClick={() => {
                  removeAxiomByType("involves");
                }}
              >
                Remove INVOLVES{" "}
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  includeAxiomByType("involvedBy");
                }}
              >
                Include INVOLVED BY{" "}
              </Button>

              <Button
                onClick={() => {
                  removeAxiomByType("involvedBy");
                }}
              >
                Remove INVOLVED BY{" "}
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  includeAxiomByType("thread");
                }}
              >
                Include Threads{" "}
              </Button>

              <Button
                onClick={() => {
                  removeAxiomByType("thread");
                }}
              >
                Remove Threads{" "}
              </Button>
            </div>

          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default GraphTabs;
