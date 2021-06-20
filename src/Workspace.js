import React, { useContext, useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { store } from "./MyContext";
import Thread from "./Thread";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import CreateIcon from "@material-ui/icons/Create";
import { Link } from "react-router-dom";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ExtensionIcon from "@material-ui/icons/Extension";
import CloseIcon from "@material-ui/icons/Close";
import DeleteIcon from "@material-ui/icons/Delete";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import DraggableList from "./DraggableList";

import Chip from "@material-ui/core/Chip";

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

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  const classes = useStyles();
  // const actor = _.cloneDeep(
  //   globalState.state.actors.find((x) => x.uuid === actorUuid)
  // );

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
    //if(actor && actor.content){
    newContent.blocks = newContent.blocks.map((x, index) => {
      x.key = actorUuid + ":" + index;
      return x;
    });
    //}
    actor.content = newContent;
    if (tags) {
      actor.tags = tags;
    }

    // actor.content = newContent
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

  return (
    <div
      style={{
        width: windowDimensions.width - 800,
      }}
    >
      {actor && actor.type === "snippet" && (
        <div>
          <h1 style={{ color: "white", width: "820px" }}>
            <CreateIcon /> {getDisplayName(actorUuid)}{" "}
            <DeleteIcon style={{ float: "right" }} onClick={remove} />
          </h1>

          <div
            style={{
              display: "flex",
            }}
          >
            <TextEditor
              save={save}
              data={
                globalState.state.actors.find((x) => x.uuid === actorUuid)
                  .content
              }
              actorUuid={actorUuid}
            ></TextEditor>
            <div>
              <h2 className={classes.subSection}>Elements</h2>

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
                        <ExtensionIcon
                          style={{ position: "relative", top: "7px" }}
                        />
                        {x.name}
                      </Link>
                      <CloseIcon onClick={() => removeFromElements(x.uuid)} />
                    </div>
                  );
                })}
              <br />

              <FormControl variant="filled">
                <InputLabel id="demo-simple-select-outlined-label">
                  Select
                </InputLabel>
                <Select
                  style={{
                    width: "200px",
                    color: "white",
                    outlineColor: "white",
                  }}
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== "Select") {
                      addToElements(e.target.value);
                    }
                  }}
                  label="Subject"
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {globalState.state.actors
                    .filter(
                      (x) =>
                        x.type === "element" &&
                        (!actor.elements ||
                          !actor.elements.map((y) => y.uuid).includes(x.uuid))
                    )
                    .map((x) => {
                      return (
                        <MenuItem value={x.uuid}>
                          {getDisplayName(x.uuid)}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>

              <h2 className={classes.subSection}>Tags</h2>
              <p className={classes.p}>Enter tags as a comma separated list</p>
              <TextField
                aria-label="empty textarea"
                placeholder="Empty"
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
                        label={tag}
                        icon={<LocalOfferIcon />}
                        style={{ margin: "2px" }}
                      />
                    );
                  }
                })}
              </div>
              <h2 className={classes.subSection}>Threads</h2>
              <div>
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
                        <Link
                          to={`/threads/${x.uuid}`}
                          className={classes.link}
                        >
                          <LinearScaleIcon
                            style={{ position: "relative", top: "7px" }}
                          />
                          {x.name}
                        </Link>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
      {actor && actor.type === "thread" && <Thread data={actor}></Thread>}

      {actor && actor.type === "element" && (
        <div>
          <h1 style={{ color: "white", width: "820px" }}>
            <ExtensionIcon /> {getDisplayName(actorUuid)}{" "}
            <DeleteIcon style={{ float: "right" }} onClick={remove} />
          </h1>

          <div
            style={{
              display: "flex",
            }}
          >
            <TextEditor
              save={save}
              data={
                globalState.state.actors.find((x) => x.uuid === actorUuid)
                  .content
              }
              actorUuid={actorUuid}
            ></TextEditor>
            <div>
              <h2 className={classes.subSection}>Snippets</h2>

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
                        <CreateIcon
                          style={{ position: "relative", top: "7px" }}
                        />
                        {x.name}
                      </Link>
                    </div>
                  );
                })}

              <h2 className={classes.subSection}>Tags</h2>
              <p className={classes.p}>Enter tags as a comma separated list</p>
              <TextField
                aria-label="empty textarea"
                placeholder="Empty"
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
                        label={tag}
                        icon={<LocalOfferIcon />}
                        style={{ margin: "2px" }}
                      />
                    );
                  }
                })}
              </div>
              <h2 className={classes.subSection}>Threads</h2>
              <div>
                {globalState.state.actors
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
                    x.map((y) => {
                      return (
                        <div>
                          <Link
                            to={`/threads/${y.uuid}`}
                            className={classes.link}
                          >
                            <LinearScaleIcon   style={{ position: "relative", top: "7px" }}/>
                            {y.name}
                          </Link>
                         
                        </div>
                      );
                    })
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
