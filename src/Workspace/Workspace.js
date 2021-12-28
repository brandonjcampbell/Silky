import React, { useContext, useState, useEffect } from "react";
import TextEditor from "../TextEditor";
import { store } from "../MyContext";
import Thread from "../Thread";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "react-router-dom";
import CloseIcon from "@material-ui/icons/Close";
import DeleteIcon from "@material-ui/icons/Delete";
import FormControl from "@material-ui/core/FormControl";
import Avatar from "@mui/material/Avatar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@material-ui/core/Chip";
import Map from "../Map";
import Autocomplete from "@mui/material/Autocomplete";

const { dialog } = window.require("electron").remote;
const fs = window.require("fs");
const path = window.require("path");
const homedir = window.require("os").homedir();
const nativeImage = window.require("electron").nativeImage;

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );
  const [currentTab, setCurrentTab] = useState(0);

  const uploadPic = async () => {
    // Open a dialog to ask for the file path
    dialog.showOpenDialog({ properties: ["openFile"] }).then(function (data) {
      console.log(data);
      const filePath = data.filePaths[0];
      if (filePath) {
        const fileName = path.basename(data.filePaths[0]);

        const newPath =
          homedir +
          "\\.silky\\" +
          globalState.state.project +
          "\\" +
          actorUuid +
          ".png";
        const image = nativeImage.createFromPath(filePath);
        fs.writeFileSync(newPath, image.resize({ height: 100 }).toPNG());
        setFreshener(performance.now());
      }
    });
  };

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");

  const classes = useStyles();

  useEffect(() => {
    console.log("workspace useeffect");
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");

  const save = (newContent, key) => {
    newContent.blocks = newContent.blocks.map((x, index) => {
      x.key = actorUuid + ":" + index;
      return x;
    });
    actor.content = newContent;
    if (tags) {
      actor.tags = tags;
    }

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

  function getDisplayName(uuid) {
    return globalState.getDisplayName(
      globalState,
      globalState.find(globalState, uuid)
    );
  }

  const remove = () => {
    dispatch({
      action: "removeActor",
      payload: { uuid: actorUuid },
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

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const saveTitle = () => {
    setEditTitle(false);
    let clone = _.cloneDeep(actor);
    clone.name = title;
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  };

  return (
    <div>
      {actor && actor.type !== "thread" && actor.type !== "map" && (
        <h2>
          <Avatar
            alt=" "
            sx={{ width: 100, height: 100 }}
            onClick={() => {
              uploadPic();
            }}
            src={
              homedir +
              "\\.silky\\" +
              globalState.state.project +
              "\\" +
              actorUuid +
              ".png?" +
              freshener
            }
          />

          <span
            onClick={() => {
              setEditTitle(!editTitle);
              setTitle(getDisplayName(actorUuid));
            }}
          >
            {!editTitle && getDisplayName(actorUuid)}
          </span>
          {editTitle && (
            <TextField
              autoFocus
              sx={{ bgcolor: "white" }}
              id="outlined-basic"
              value={title}
              onKeyDown={keyPress}
              onBlur={() => {
                saveTitle();
              }}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}

          <DeleteIcon onClick={remove} />
        </h2>
      )}
      <div>
        {actor && actor.type !== "thread" && actor.type !== "map" && (
          <TextEditor
            save={save}
            data={
              globalState.state.actors.find((x) => x.uuid === actorUuid).content
            }
            actorUuid={actorUuid}
          ></TextEditor>
        )}

        {actor && actor.type === "snippet" && (
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
                <Tab label="Elements" {...a11yProps(0)} />
                <Tab label="Tags" {...a11yProps(1)} />
                <Tab label="Threads" {...a11yProps(2)} />
              </Tabs>
            </Box>
            <TabPanel value={currentTab} index={0}>
              {globalState.state.actors
                .filter(
                  (a) =>
                    a.type === "element" &&
                    actor &&
                    actor.elements &&
                    actor.elements.map((x) => x.uuid).includes(a.uuid)
                )
                .map((x) => {
                  return (
                    <div>
                      <Link to={`/elements/${x.uuid}`} className={classes.link}>
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
                      <CloseIcon onClick={() => removeFromElements(x.uuid)} />
                    </div>
                  );
                })}

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
                          .map((m) => getDisplayName(m.uuid))
                          .toString()
                      : "")
                  }
                  options={globalState.state.actors.filter(
                    (x) => x.type === "element"
                  )}
                  sx={{ width: 600, bgcolor: "white", borderRadius: "4px" }}
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
                    return <Chip label={tag} icon={<LocalOfferIcon />} />;
                  }
                })}
              </div>
            </TabPanel>
            <TabPanel value={currentTab} index={2}>
              {globalState.state.actors
                .filter(
                  (actor) =>
                    actor.type === "thread" &&
                    actor.sequence &&
                    actor.sequence
                      .map((y) => {
                        return y.uuid;
                      })
                      .includes(actorUuid)
                )
                .map((x) => {
                  return (
                    <div>
                      <Link to={`/threads/${x.uuid}`} className={classes.link}>
                        <Avatar
                          alt=" "
                          sx={{ bgcolor: x.color ? x.color : "grey" }}
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
            <div></div>
          </div>
        )}
        {actor && actor.type === "thread" && <Thread data={actor}></Thread>}

        {actor && actor.type === "map" && <Map data={actor}></Map>}

        {actor && actor.type === "element" && (
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
                        <Link
                          to={`/threads/${y.uuid}`}
                          className={classes.link}
                        >
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
    </div>
  );
};

export default Workspace;
