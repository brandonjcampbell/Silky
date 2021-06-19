import React, { useContext, useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { store } from "./MyContext";
import Thread from "./Thread";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import { makeStyles } from "@material-ui/core/styles";
import ExtensionIcon from "@material-ui/icons/Extension";
import { Link } from "react-router-dom";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import DeleteIcon from "@material-ui/icons/Delete";


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

  return (
    <div
      style={{
        width: windowDimensions.width - 800,
      }}
    >
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
    </div>
  );
};

export default Workspace;
