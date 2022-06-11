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

import FormControl from "@material-ui/core/FormControl";
import { getDisplayName } from "../../utils";
import Autocomplete from "@mui/material/Autocomplete";
import "./FactTabs.css";

import { TiScissors } from "react-icons/ti";
import { GiLightBulb, GiPendulumSwing } from "react-icons/gi";
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
const FactTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");

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

  function addTo(uuid, type) {
    let el = globalState.state.actors.filter((x) => x.uuid === uuid)[0];
    let clone = _.cloneDeep(el);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts.push({ uuid: actor.uuid });
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: clone },
    });
  }

  function removeFrom(uuid, type) {
    let el = globalState.state.actors.filter((x) => x.uuid === uuid)[0];

    let clone = _.cloneDeep(el);
    if (!clone.facts) {
      clone.facts = [];
    }
    console.log(clone.facts);
    clone.facts = clone.facts.filter((x) => x.uuid !== actor.uuid);
    console.log(clone.facts);
    dispatch({
      action: "saveActor",
      for: type,
      payload: { actor: clone },
    });
  }

  function addToFacts(uuid) {
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

  function removeFromFacts(uuid) {
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
                label={<HiPuzzle className="menuItem" />}
                {...a11yProps(0)}
              />
              <Tab
                label={<GiLightBulb className="menuItem" />}
                {...a11yProps(1)}
              />
              <Tab
                label={<TiScissors className="menuItem" />}
                {...a11yProps(2)}
              />

              <Tab
                label={<AiFillTag className="menuItem" />}
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>

          <TabPanel className="tabPanel" value={currentTab} index={0}>
            <SimpleList
              type="element"
              xAction={(uuid) => {
                removeFrom(uuid, "element");
              }}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "element" &&
                  a.facts &&
                  a.facts.map((x) => x.uuid).includes(actor.uuid)
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
                  (option.facts
                    ? option.facts
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) =>
                    x.type === "element" &&
                    (!x.facts ||
                      (x.facts &&
                        !x.facts.map((y) => y.uuid).includes(actor.uuid)))
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addTo(newValue.uuid, "element");
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      <Avatar
                        alt=" "
                        sx={{ bgcolor: option.color ? option.color : "grey" }}
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
                renderInput={(params) => {
                  if(params && params.inputProps ){
                  params.inputProps.value=null;
                  }
                  return <TextField {...params} label="Then..." value={null} />;
                }}
              />
            </FormControl>
            <FormDialog
              type={"element"}
              specialOp={(uuid) => {
                addTo(uuid, "element");
              }}
            />
          </TabPanel>

          <TabPanel className="tabPanel" value={currentTab} index={1}>
            <div className="readOnlyListTab">
            <SimpleList
              type="links"
              showAvatars={false}
              xAction={removeFromFacts}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "link" &&
                  actor &&
                  actor.facts &&
                  actor.facts.map((x) => x.uuid).includes(a.uuid)
              )}
            />

            <SimpleList
              type="links"
              showAvatars={false}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "link" &&
                  a.subjects &&
                  a.targets &&
                  (a.subjects.map((x) => x.uuid).includes(actor.uuid) ||
                    a.targets.map((x) => x.uuid).includes(actor.uuid))
              )}
            />
            </div>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <SimpleList
              type="snippets"
              showAvatars={false}
              xAction={(uuid) => {
                removeFrom(uuid, "snippet");
              }}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "snippet" &&
                  a.facts &&
                  a.facts.map((x) => x.uuid).includes(actor.uuid)
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
                  (option.facts
                    ? option.facts
                        .map((m) => getDisplayName(m.uuid, globalState))
                        .toString()
                    : "")
                }
                options={globalState.state.actors.filter(
                  (x) =>
                    x.type === "snippet" &&
                    (!x.facts ||
                      (x.facts &&
                        !x.facts.map((y) => y.uuid).includes(actor.uuid)))
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addTo(newValue.uuid, "snippet");
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      {props.key.split("@tags:")[0]}
                    </span>
                  </div>
                )}
                renderInput={(params) => {
                  if(params && params.inputProps ){
                  params.inputProps.value=null;
                  }
                  return <TextField {...params} label="Then..." value={null} />;
                }}
              />
            </FormControl>
            <FormDialog
              type={"snippet"}
              specialOp={(uuid) => {
                addTo(uuid, "snippet");
              }}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <TextField
              aria-label="empty textarea"
              placeholder="Enter tags as a comma separated list"
              className={classes.root}
              value={tags}
              onChange={(e) => {
                tagSave(e.target.value);
              }}
            />
            <div>
              {tags.split(",").map((tag) => {
                if (tag) {
                  return (
                    <Chip
                      className="tag"
                      label={tag}
                      icon={<LocalOfferIcon />}
                    />
                  );
                }
              })}
            </div>
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default FactTabs;
