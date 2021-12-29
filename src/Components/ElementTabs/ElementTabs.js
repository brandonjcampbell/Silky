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
const homedir = window.require("os").homedir();
const useStyles = makeStyles({
  root: {
    background: "#333",
    color: "white",
    width: "500px",
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

  const tagSave = (newTags) => {
    actor.tags = newTags;
    setTags(newTags);
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  return (
    <div>
      {actor && (
        <div>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              width: "600px",
              fontColor: "white",
            }}
          >
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => {
                setCurrentTab(newValue);
              }}
              aria-label="basic tabs example"
            >
              <Tab label="Snippets" {...a11yProps(0)} />
              <Tab label="Tags" {...a11yProps(1)} />
              <Tab label="Threads" {...a11yProps(2)} />
            </Tabs>
          </Box>
          <TabPanel value={currentTab} index={0}>
            {globalState.state.actors
              .filter(
                (a) =>
                  a.type === "snippet" &&
                  a.elements &&
                  a.elements.map((x) => x.uuid).includes(actor.uuid)
              )
              .map((x) => {
                return (
                  <div>
                    <Link to={`/snippets/${x.uuid}`} className={classes.link}>
                      <Avatar
                        alt=" "
                        src={
                          homedir +
                          "\\.silky\\" +
                          globalState.state.project +
                          "\\" +
                          x.uuid +
                          ".png"
                        }
                      />
                      {x.name}
                    </Link>
                  </div>
                );
              })}
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
                  return <Chip label={tag} icon={<LocalOfferIcon />} />;
                }
              })}
            </div>
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
            {_.uniqBy(
              globalState.state.actors
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
                .map((snippet) =>
                  globalState.state.actors.filter(
                    (t) =>
                      t.type === "thread" &&
                      t.sequence &&
                      t.sequence
                        .map((y) => {
                          return y.uuid;
                        })
                        .includes(snippet.uuid)
                  )
                )
                .map((x) =>
                  x.map((y) => (
                    <div>
                      <Link to={`/threads/${y.uuid}`} className={classes.link}>
                        <Avatar
                          alt=" "
                          sx={{ bgcolor: y.color ? y.color : "grey" }}
                          src={
                            homedir +
                            "\\.silky\\" +
                            globalState.state.project +
                            "\\" +
                            y.uuid +
                            ".png"
                          }
                        />
                        {y.name}
                      </Link>
                    </div>
                  ))
                ),
              "uuid"
            )}
          </TabPanel>
        </div>
      )}
    </div>
  );
};

export default ElementTabs;
