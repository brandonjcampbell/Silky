import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Linker from "../Linker";
import TabPanel from "../TabPanel";
import SimpleList from "../SimpleList";
import { GiSewingString, GiLightBulb } from "react-icons/gi";
import { AiFillTag } from "react-icons/ai";
import "./SnippetTabs.css";

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
                label={<span className="menuItemLabel">Reveals<GiLightBulb className="menuItem" /></span>}
                {...a11yProps(0)}
              />
              <Tab
                label={<span className="menuItemLabel">Threads <GiSewingString className="menuItem" /></span>}
                {...a11yProps(1)}
              />
              <Tab
                label={<span className="menuItemLabel">Tags<AiFillTag className="menuItem" /></span>}
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>
          <TabPanel className="tabPanel" value={currentTab} index={0}>
            <Linker
              actor={actor}
              side="subject"
              linkType="REVEALS"
              guestType="fact"
            />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <SimpleList
              type="threads"
              list={globalState.state.actors.filter(
                (actor) =>
                  actor.type === "thread" &&
                  actor.sequence &&
                  actor.sequence
                    .map((y) => {
                      return y.uuid;
                    })
                    .includes(actorUuid)
              )}
            />
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
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

export default SnippetTabs;
