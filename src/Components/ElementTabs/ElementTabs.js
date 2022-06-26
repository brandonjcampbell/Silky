import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import TabPanel from "../TabPanel";
import SimpleList from "../SimpleList";
import FormDialog from "../FormDialog";
import Linker from "../Linker";

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
  if (!actor.facts) {
    actor.facts = [];
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

  function addTo(uuid, type) {
    let clone = _.cloneDeep(actor);
    console.log(clone);
    if (!clone[type]) {
      clone[type] = [];
    }
    console.log(clone);

    clone[type].push({ uuid: uuid });
    dispatch({
      action: "saveActor",
      for: "snippet",
      payload: { actor: clone },
    });
  }

  function removeFrom(uuid, type) {
    let clone = _.cloneDeep(actor);
    if (!clone[type]) {
      clone[type] = [];
    }
    clone[type] = clone[type].filter((x) => x.uuid !== uuid);
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
                {...a11yProps(0)}
              />

              <Tab
                label={<GiSewingString className="menuItem" />}
                {...a11yProps(1)}
              />
              <Tab
                label={<AiFillTag className="menuItem" />}
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>

          <TabPanel className="tabPanel" value={currentTab} index={0}>
            <Linker
              actor={actor}
              side="subject"
              linkType="INVOLVES"
              guestType="fact"
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <SimpleList list={getThreads()} />
          </TabPanel>

          <TabPanel className="tabPanel" value={currentTab} index={2}>
            TAGS
            <Linker
              actor={actor}
              side="subject"
              linkType="TAGS"
              guestType="tag"
            />
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default ElementTabs;
