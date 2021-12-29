import React, { useContext, useState, useEffect } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@mui/material/Avatar";

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

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");

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
      {actor && (
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
      {actor && (
        <TextEditor
          save={save}
          data={
            globalState.state.actors.find((x) => x.uuid === actorUuid).content
          }
          actorUuid={actorUuid}
        ></TextEditor>
      )}
    </div>
  );
};

export default Workspace;