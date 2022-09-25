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
  if (actor && !actor.facts) {
    actor.facts = [];
  }

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
                label={
                  <span className="menuItemLabel">
                    Facts <GiLightBulb className="menuItem" />
                  </span>
                }
                {...a11yProps(0)}
              />
              <Tab
                label={
                  <span className="menuItemLabel">
                    Tags <AiFillTag className="menuItem" />
                  </span>
                }
                {...a11yProps(1)}
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
          <TabPanel className="tabPanel" value={currentTab} index={1}>
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
