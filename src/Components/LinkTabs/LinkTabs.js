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
import "./LinkTabs.css";

import { TiScissors } from "react-icons/ti";
import { GiLightBulb } from "react-icons/gi";
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
const LinkTabs = ({ actorUuid }) => {
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

  function removeFrom(uuid,prop, type) {
    let el = globalState.state.actors.filter((x) => x.uuid === uuid)[0];

    let clone = _.cloneDeep(el);
    if (!clone[prop]) {
      clone[prop]= [];
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
                label={<TiScissors className="menuItem" />}
                {...a11yProps(0)}
              />

              <Tab
                label={<AiFillTag className="menuItem" />}
                {...a11yProps(1)}
              />
            </Tabs>
          </Box>
          <TabPanel value={currentTab} index={0}>

            <SimpleList
              type="snippets"
              xAction={(uuid) => {
                removeFrom(uuid, "links","snippet");
              }}
              list={globalState.state.actors.filter(
                (a) =>
                  a.type === "snippet" &&
                  a.links &&
                  a.links.map((x) => x.uuid).includes(actor.uuid)
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
                    (!x.links ||
                      (x.links &&
                        !x.links.map((y) => y.uuid).includes(actor.uuid)))
                )}
                sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
                onChange={(e, newValue) => {
                  if (newValue && newValue !== "Select") {
                    addTo(newValue.uuid,"links", "snippet");
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
                  <TextField {...params} label="Add a Snippet..." />
                )}
              />
            </FormControl>
            <FormDialog
              type={"snippet"}
              specialOp={(uuid) => {
                addTo(uuid, "snippet");
              }}
            />
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

export default LinkTabs;
