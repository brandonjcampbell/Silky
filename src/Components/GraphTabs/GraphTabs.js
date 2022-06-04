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
import Switch from "@mui/material/Switch";
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
import { GiLightBulb, GiSewingString, GiSettingsKnobs } from "react-icons/gi";
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

  const init = () => {

    if (!actor.show) {
      actor.show=[]
    }

    if (!actor.showActor) {
      actor.showActor=[]
    }

    if (!actor.showAxiom) {
      actor.showAxiom=[]
    }

    if (!actor.layout) {
      actor.layout="cola"
    }

    if (!actor.thread) {
      actor.thread = globalState.state.actors
        .filter((x) => x.type === "thread")
        .map((x) => {
          return { uuid: x.uuid };
        });
    }

    if (!actor.snippet) {
      actor.snippet = globalState.state.actors
        .filter((x) => x.type === "snippet")
        .map((x) => {
          return { uuid: x.uuid };
        });
    }

    if (!actor.element) {
      actor.element = globalState.state.actors
        .filter((x) => x.type === "element")
        .map((x) => {
          return { uuid: x.uuid };
        });
    }

    if (!actor.fact) {
      actor.fact = globalState.state.actors
        .filter((x) => x.type === "fact")
        .map((x) => {
          return { uuid: x.uuid };
        });
    }

    if (!actor.link) {
      actor.link = globalState.state.actors
        .filter((x) => x.type === "link")
        .map((x) => {
          return { uuid: x.uuid };
        });
    }
  };

  init()
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
    actor[prop].push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: actor },
    });
    recalculateShow()
  }

  function removeFrom(uuid, prop, type) {
    actor[prop] = actor[prop].filter((x) => x.uuid !== uuid);
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: actor },
    });
    recalculateShow()
  }

  function toggleActorType(type) {
    if (!actor.showActor) {
      actor.showActor = [];
    }
    if (actor.showActor.includes(type)) {
      actor.showActor = actor.showActor.filter((x) => x !== type);
    } else {
      actor.showActor.push(type);
    }

    if (type === "fact") {
      toggleAxiomType("because");
      toggleActorType("link");
    } else {
      recalculateShow();
    }
  }

  function recalculateShow() {
    const masterList = [...actor.element,...actor.fact,...actor.snippet].map(y=>y.uuid)
    console.log(masterList)
    actor.show = globalState.state.actors
      .filter(x=>masterList.includes(x.uuid) || x.type==="link")
      .filter((x) => actor.showActor.includes(x.type))
      .map((x) => {
        return x.uuid;
      });
    save();
  }

  function toggleAxiomType(type) {
    if (!actor.showAxiom) {
      actor.showAxiom = [];
    }
    if (actor.showAxiom.includes(type)) {
      actor.showAxiom = actor.showAxiom.filter((x) => x !== type);
    } else {
      actor.showAxiom.push(type);
    }
    if (type === "thread") {
      if (!actor.thread) {
        actor.thread = globalState.state.actors
          .filter((x) => x.type === "thread")
          .map((x) => {
            return { uuid: x.uuid };
          });
      }
    }
    save();
  }

  function renderActorToggle(type) {
    return (
      <div>
        <Switch
          onChange={() => {
            toggleActorType(type);
          }}
          checked={actor.showActor && actor.showActor.includes(type)}
        />{" "}
        {type}
      </div>
    );
  }

  function renderAxiomToggle(type) {
    return (
      <div>
        <Switch
          onChange={() => {
            toggleAxiomType(type);
          }}
          checked={actor.showAxiom && actor.showAxiom.includes(type)}
        />{" "}
        {type}
      </div>
    );
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
              <Tab label={<GiSettingsKnobs className="menuItem" />} />

              <Tab label={<HiPuzzle className="menuItem" />} />

              <Tab label={<GiLightBulb className="menuItem" />} />

              <Tab label={<TiScissors className="menuItem" />} />

              <Tab label={<GiSewingString className="menuItem" />} />
            </Tabs>
          </Box>
          <TabPanel value={currentTab} index={0}>
            <h2>SETTINGS</h2>
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
              <Switch
                onChange={() => {
                  actor.repositionNodes = !actor.repositionNodes;
                  save();
                }}
                checked={actor.repositionNodes}
              />{" "}
              Reposition nodes on change
            </div>

            <div>
              <Switch
                onChange={() => {
                  actor.hideDisconnectedNodes = !actor.hideDisconnectedNodes;
                  save();
                }}
                checked={actor.hideDisconnectedNodes}
              />{" "}
              Hide disconnected nodes
            </div>

            <h2>NODES</h2>

            <h2>RELATIONSHIPS</h2>
            {renderAxiomToggle("thread")}
            {renderAxiomToggle("reveals")}
            {renderAxiomToggle("involves")}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {renderActorToggle("element")}
            {actor.showActor.includes("element") && (
              <div>
    
                <SimpleList
                  type="elements"
                  xAction={(uuid) => {
                    removeFrom(uuid, "element", "web");
                  }}
                  showAvatars={false}
                  list={globalState.state.actors.filter(
                    (a) =>
                      a.type === "element" &&
                      actor.element.map((x) => x.uuid).includes(a.uuid)
                  )}
                />
                <FormControl variant="filled">
                  <Autocomplete
                    disablePortal
                    clearOnBlur
                    selectOnFocus
                    blurOnSelect
                    id="combo-box-demo"
                    getOptionLabel={(option) =>
                      option.name +
                      "@tags:" +
                      option.tags +
                      (option.links
                        ? option.links
                            .map((m) => getDisplayName(m.uuid, globalState))
                            .toString()
                        : "")
                    }
                    options={globalState.state.actors.filter(
                      (x) =>
                        x.type === "element" &&
                        !actor.element.map((y) => y.uuid).includes(x.uuid)
                    )}
                    sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                    onChange={(e, newValue) => {
                      if (newValue && newValue !== "Select") {
                        addTo(newValue.uuid, "element", "web");
                      }
                    }}
                    renderOption={(props, option) => (
                      <div {...props}>
                        <span>{props.key.split("@tags:")[0]}</span>
                      </div>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Add an element..." />
                    )}
                  />
                </FormControl>
              </div>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {renderActorToggle("fact")}
            {actor.showActor.includes("fact") && (
              <div>
    
                <SimpleList
                  type="facts"
                  xAction={(uuid) => {
                    removeFrom(uuid, "fact", "web");
                  }}
                  showAvatars={false}
                  list={globalState.state.actors.filter(
                    (a) =>
                      a.type === "fact" &&
                      actor.fact.map((x) => x.uuid).includes(a.uuid)
                  )}
                />
                <FormControl variant="filled">
                  <Autocomplete
                    disablePortal
                    clearOnBlur
                    selectOnFocus
                    blurOnSelect
                    id="combo-box-demo"
                    getOptionLabel={(option) =>
                      option.name +
                      "@tags:" +
                      option.tags +
                      (option.links
                        ? option.links
                            .map((m) => getDisplayName(m.uuid, globalState))
                            .toString()
                        : "")
                    }
                    options={globalState.state.actors.filter(
                      (x) =>
                        x.type === "fact" &&
                        !actor.fact.map((y) => y.uuid).includes(x.uuid)
                    )}
                    sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                    onChange={(e, newValue) => {
                      if (newValue && newValue !== "Select") {
                        addTo(newValue.uuid, "fact", "web");
                      }
                    }}
                    renderOption={(props, option) => (
                      <div {...props}>
                        <span>{props.key.split("@tags:")[0]}</span>
                      </div>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Add a fact..." />
                    )}
                  />
                </FormControl>
              </div>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {renderActorToggle("snippet")}

            {actor.showActor.includes("snippet") && (
              <div>
    
                <SimpleList
                  type="snippets"
                  xAction={(uuid) => {
                    removeFrom(uuid, "snippet", "web");
                  }}
                  showAvatars={false}
                  list={globalState.state.actors.filter(
                    (a) =>
                      a.type === "snippet" &&
                      actor.snippet.map((x) => x.uuid).includes(a.uuid)
                  )}
                />
                <FormControl variant="filled">
                  <Autocomplete
                    disablePortal
                    clearOnBlur
                    selectOnFocus
                    blurOnSelect
                    id="combo-box-demo"
                    getOptionLabel={(option) =>
                      option.name +
                      "@tags:" +
                      option.tags +
                      (option.links
                        ? option.links
                            .map((m) => getDisplayName(m.uuid, globalState))
                            .toString()
                        : "")
                    }
                    options={globalState.state.actors.filter(
                      (x) =>
                        x.type === "snippet" &&
                        !actor.snippet.map((y) => y.uuid).includes(x.uuid)
                    )}
                    sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                    onChange={(e, newValue) => {
                      if (newValue && newValue !== "Select") {
                        addTo(newValue.uuid, "snippet", "web");
                      }
                    }}
                    renderOption={(props, option) => (
                      <div {...props}>
                        <span>{props.key.split("@tags:")[0]}</span>
                      </div>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Add a Snippet..." />
                    )}
                  />
                </FormControl>
              </div>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            {renderAxiomToggle("thread")}
            {actor.showAxiom.includes("thread") && (
              <div>
                <SimpleList
                  type="threads"
                  showAvatars={true}
                  xAction={(uuid) => {
                    removeFrom(uuid, "thread", "web");
                  }}
                  list={globalState.state.actors.filter(
                    (a) =>
                      a.type === "thread" &&
                      actor.thread &&
                      actor.thread.map((x) => x.uuid).includes(a.uuid)
                  )}
                />
                <FormControl variant="filled">
                  <Autocomplete
                    disablePortal
                    clearOnBlur
                    selectOnFocus
                    blurOnSelect
                    id="combo-box-demo"
                    getOptionLabel={(option) =>
                      option.name +
                      "@tags:" +
                      option.tags +
                      (option.links
                        ? option.links
                            .map((m) => getDisplayName(m.uuid, globalState))
                            .toString()
                        : "")
                    }
                    options={globalState.state.actors.filter(
                      (x) =>
                        x.type === "thread" &&
                        x.thread &&
                        (!actor.thread ||
                          !actor.thread.map((y) => y.uuid).includes(x.uuid))
                    )}
                    sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                    onChange={(e, newValue) => {
                      if (newValue && newValue !== "Select") {
                        addTo(newValue.uuid, "thread", "web");
                      }
                    }}
                    renderOption={(props, option) => (
                      <div {...props}>
                        <span>
                          <Avatar
                            alt=" "
                            sx={{
                              bgcolor: option.color ? option.color : "grey",
                            }}
                            src={
                              homedir +
                              "\\.silky\\" +
                              globalState.state.project +
                              "\\" +
                              option.uuid +
                              ".png"
                            }
                          />
                          {props.key.split("@tags:")[0]}
                        </span>
                      </div>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Add a Thread..." />
                    )}
                  />
                </FormControl>
              </div>
            )}{" "}
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default GraphTabs;
