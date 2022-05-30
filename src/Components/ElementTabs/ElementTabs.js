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
import "./ElementTabs.css";

import { TiScissors } from "react-icons/ti";
import { GiSewingString, GiLightBulb } from "react-icons/gi";
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
const ElementTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  if(!actor.facts){
    actor.facts=[]
  }

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
          snippet.elements &&
          snippet.elements
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

  function addToFacts(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.facts) {
      clone.facts = [];
    }
    clone.facts.push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "snippet",
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
      for: "snippet",
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
                label={<GiLightBulb className="menuItem" />}
                {...a11yProps(1)}
              />
              <Tab
                label={<TiScissors className="menuItem" />}
                {...a11yProps(0)}
              />

              <Tab
                label={<GiSewingString className="menuItem" />}
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
              type="facts"
              showAvatars={false}
              xAction={removeFromFacts}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "fact" &&
                  actor &&
                  actor.facts &&
                  actor.facts.map((x) => x.uuid).includes(a.uuid)
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
                  (x) => x.type === "fact" 
                  &&
                  actor.facts 
                  &&
                  !actor.facts.map((y) => y.uuid).includes(x.uuid)
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addToFacts(newValue.uuid);
                  }
                }}
                renderOption={(props, option) => (
                  <div {...props}>
                    <span>
                      {props.key.split("@tags:")[0]}
                    </span>
                  </div>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Add a Fact..." />
                )}
              />
            </FormControl>
            <FormDialog type={"fact"} specialOp={addToFacts} />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <SimpleList
              type="snippets"
              showAvatars={false}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "snippet" &&
                  a.elements &&
                  a.elements.map((x) => x.uuid).includes(actor.uuid)
              )}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <SimpleList list={getThreads()} />
          </TabPanel>
          {/* <TabPanel value={currentTab} index={3}>
            <video autoplay="true" className="videoElement"></video>
            <canvas></canvas>
            <button
              id="snap"
              onClick={() => {
                snap();
              }}
            >
              Take screenshot
            </button>
            <p className="OCR"></p>
          </TabPanel> */}
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

export default ElementTabs;
