import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import CloseIcon from "@material-ui/icons/Close";
import FormControl from "@material-ui/core/FormControl";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@material-ui/core/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import TabPanel from "../TabPanel";
import {getDisplayName} from "../../utils";
import SimpleList from "../SimpleList";

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

const SnippetTabs = ({ actorUuid }) => {
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

  function addToElements(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.elements) {
      clone.elements = [];
    }
    clone.elements.push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "snippet",
      payload: { actor: clone },
    });
  }

  function removeFromElements(uuid) {
    let clone = _.cloneDeep(actor);
    if (!clone.elements) {
      clone.elements = [];
    }
    clone.elements = clone.elements.filter((x) => x.uuid !== uuid);
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
                <Tab label="Elements" {...a11yProps(0)} />
                <Tab label="Tags" {...a11yProps(1)} />
                <Tab label="Threads" {...a11yProps(2)} />
              </Tabs>
            </Box>
            <TabPanel value={currentTab} index={0}>
              <SimpleList 
                xAction={removeFromElements}
                list={globalState.state.actors
                .filter(
                  (a) =>
                    a.type === "element" &&
                    actor &&
                    actor.elements &&
                    actor.elements.map((x) => x.uuid).includes(a.uuid)
                )}/>
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
                    (option.elements
                      ? option.elements
                          .map((m) => getDisplayName(m.uuid,globalState))
                          .toString()
                      : "")
                  }
                  options={globalState.state.actors.filter(
                    (x) => x.type === "element"
                  )}
                  sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                  onChange={(e, newValue) => {
                    if (newValue && newValue !== "Select") {
                      addToElements(newValue.uuid);
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
                  renderInput={(params) => (
                    <TextField {...params} label="Add an element..." />
                  )}
                />
              </FormControl>
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
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
                    return <Chip className="tag" label={tag} icon={<LocalOfferIcon />} />;
                  }
                })}
              </div>
            </TabPanel>
            <TabPanel value={currentTab} index={2}>
              <SimpleList list = {globalState.state.actors
                .filter(
                  (actor) =>
                    actor.type === "thread" &&
                    actor.sequence &&
                    actor.sequence
                      .map((y) => {
                        return y.uuid;
                      })
                      .includes(actorUuid)
                )}/>
            </TabPanel>
          </div>
        )}
    </div>
  );
};

export default SnippetTabs;
