import React, { useContext, useState, useEffect } from "react";
import {useParams} from "react-router-dom";
import { store } from "../../MyContext";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import TabPanel from "../TabPanel";
import SimpleList from "../SimpleList";

import Linker from "../Linker";

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
const FactTabs = () => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [currentTab, setCurrentTab] = useState(0);
  const classes = useStyles();
  const {uuid} = useParams();
  const actorUuid= uuid;

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");

  return (
    <div>
      {actor && (
        <>
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
                    <GiLightBulb className="menuItem" />
                  </span>
                }
                {...a11yProps(0)}
              />
              <Tab
                label={
                  <span className="menuItemLabel">
                    <HiPuzzle className="menuItem" />
                  </span>
                }
                {...a11yProps(1)}
              />

              <Tab
                label={
                  <span className="menuItemLabel">
                    <TiScissors className="menuItem" />
                  </span>
                }
                {...a11yProps(2)}
              />

              <Tab
                label={
                  <span className="menuItemLabel">
                    <AiFillTag className="menuItem" />
                  </span>
                }
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>
          <TabPanel className="tabPanel" value={currentTab} index={0}>
            <div className="readOnlyListTab">
              <h2 className="subtitle">Causes:</h2>
              <SimpleList
                type="facts"
                list={globalState.state.actors.filter((x) =>
                  globalState.state.actors.find(
                    (y) =>
                      y.type === "link" &&
                      y.name === "CAUSES" &&
                      y.subjects &&
                      y.subjects.includes(x.uuid) &&
                      y.targets &&
                      y.targets.includes(actor.uuid)
                  )
                )}
              />

              <h2 className="subtitle">Consequences:</h2>
              <SimpleList
                type="facts"
                list={globalState.state.actors.filter((x) =>
                  globalState.state.actors.find(
                    (y) =>
                      y.type === "link" &&
                      y.name === "CAUSES" &&
                      y.subjects &&
                      y.subjects.includes(actor.uuid) &&
                      y.targets &&
                      y.targets.includes(x.uuid)
                  )
                )}
              />
            </div>
          </TabPanel>
          <TabPanel className="tabPanel" value={currentTab} index={1}>
            <Linker
              actor={actor}
              side="target"
              linkType="INVOLVES"
              guestType="element"
            />
            <button
              onClick={() => {
                dispatch({
                  action: "autoLink",
                  for: "fact",
                  payload: actor,
                });
              }}
            >
              AUTOLINK Elements
            </button>
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
            <Linker
              actor={actor}
              side="target"
              linkType="REVEALS"
              guestType="snippet"
            />
          </TabPanel>
          <TabPanel value={currentTab} index={3}>
            <Linker
              actor={actor}
              side="subject"
              linkType="TAGS"
              guestType="tag"
            />
          </TabPanel>
        </>
      )}
    </div>
  );
};

export default FactTabs;
