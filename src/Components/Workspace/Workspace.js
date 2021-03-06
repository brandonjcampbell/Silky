import React, { useContext, useState, useEffect } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
import _ from "lodash";
import TitleBar from "../TitleBar";

import "react-confirm-alert/src/react-confirm-alert.css"; // Import css

import "./Workspace.css";

const homedir = window.require("os").homedir();

const Workspace = ({ actorUuid, showAvatar = true }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

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

  return (
    <div className="workspace"> 
      <TitleBar actor={actor} />
      {actor && (
        <div className="editor">
          <TextEditor
            showAvatar={showAvatar}
            save={save}
            data={
              globalState.state.actors.find((x) => x.uuid === actorUuid).content
            }
            actorUuid={actorUuid}
          ></TextEditor>
        </div>
      )}
    </div>
  );
};
export default Workspace;
