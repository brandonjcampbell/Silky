import React, { useContext, useState, useEffect } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@mui/material/Avatar";
import { uploadPic } from "../../utils";
import "./Workspace.css";

const homedir = window.require("os").homedir();

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
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

  const remove = () => {
    dispatch({
      action: "removeActor",
      payload: { uuid: actorUuid },
    });
  };

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
    <div className="workspace">
      {actor && (
        <h2>
          <Avatar
            className="avatar"
            alt=" "
            sx={{ width: 100, height: 100 }}
            onClick={() => {
              uploadPic(actorUuid, globalState, setFreshener);
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
          <span className="title">
            <span
              onClick={() => {
                setEditTitle(!editTitle);
                setTitle(actor.name);
              }}
            >
              {!editTitle && actor.name}
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
          </span>
          <span className="delete">
            <DeleteIcon onClick={remove} />
          </span>
        </h2>
      )}
      {actor && (
        <div className="editor">
          <TextEditor
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
