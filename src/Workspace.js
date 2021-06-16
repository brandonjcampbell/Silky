import React, { useContext, useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { store } from "./MyContext";
import Thread from "./Thread";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";

import Chip from "@material-ui/core/Chip";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

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
    actor.tags = newTags
    setTags(newTags)

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

  return (
    <div
      style={{
        height: windowDimensions.height - 40,
        width: windowDimensions.width - 800,
      }}
    >
      {actor.type == "element" && (
        <div>
          <h1 style={{ color: "white" }}>
            Element: {getDisplayName(actorUuid)}
          </h1>
          <TextEditor
            save={save}
            data={
              globalState.state.actors.find((x) => x.uuid === actorUuid).content
            }
            actorUuid={actorUuid}
          ></TextEditor>
          <div>
            {tags.split(",").map((tag) => {
              if (tag) {
                return <Chip label={tag} />;
              }
            })}
          </div>

          <TextField
            aria-label="empty textarea"
            placeholder="Empty"
            value={tags}
            onChange={(e) => {
              tagSave(e.target.value);
            }}
          />
        </div>
      )}
      {actor.type == "thread" && <Thread data={actor}></Thread>}
    </div>
  );
};

export default Workspace;
