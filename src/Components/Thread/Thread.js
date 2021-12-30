import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@mui/material/TextField";
import TextEditor from "../TextEditor";
import DeleteIcon from "@material-ui/icons/Delete";
import { ColorPicker } from "material-ui-color";

const Thread = ({ actorUuid }) => {
  const globalState = useContext(store);
  const [actor,setActor]= useState(globalState.state.actors.find((x) => x.uuid === actorUuid))
  const data = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const { dispatch } = globalState;
  function determineOutput() {
    let output = [];
    if (data.sequence) {
      data.sequence.forEach((x, index) => {
        const result = globalState.state.actors.find((y) => y.uuid === x.uuid);
        const xz = result
          ? result.content
            ? result.content.blocks
              ? result.content.blocks.map((z, zindex) => {
                  z.key = x.uuid + ":" + zindex;
                  return z;
                })
              : []
            : []
          : [];

        output = [...output, ...xz];
      });
      return output;
    }
    return [];
  }

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [toggle, setToggle] = useState(true);
  const [threadContent, setThreadContent] = useState(null);

  function updateColor(color) {
    console.log("doin update4color", color);
    let clone = _.cloneDeep(data);
    clone.color = "#" + color.hex;
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  const remove = () => {
    dispatch({
      action: "removeActor",
      payload: { uuid: data.uuid },
    });
  };

  useEffect(() => {
    setThreadContent(determineOutput());
    redrawText()
  }, [globalState.state.actors]);

  const save = (newContent, key) => {
    const actorKey = key.split(":")[0];
    const actor = _.cloneDeep(
      globalState.state.actors.find((x) => x.uuid === actorKey)
    );
    const actorContent = newContent.blocks.filter(
      (x) => x.key.split(":")[0] === actorKey || !x.key.includes(":")
    );
    if (actor && actor.content) {
      actor.content.blocks = actorContent;
      dispatch({
        action: "saveActor",
        payload: { actor: actor },
      });
    }
  };

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      setEditTitle(false);
      let clone = _.cloneDeep(data);
      clone.name = title;
      dispatch({
        action: "saveActor",
        for: "thread",
        payload: { actor: clone },
      });
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const redrawText = () => {
    setToggle(false);
    setTimeout((x) => {
      setToggle(true);
    }, 0.1);
  };

  return (
    <div>
      {data && (
        <div>
          <h2>
            <div>
              <ColorPicker
                value={data.color ? data.color : "transparent"}
                hideTextfield
                onChange={(e) => updateColor(e)}
              />
            </div>

            <span
              onClick={() => {
                setEditTitle(!editTitle);
                setTitle(data.name);
              }}
            >
              {!editTitle && data.name}
            </span>

            {editTitle && (
              <TextField
                autoFocus
                id="outlined-basic"
                value={title}
                onKeyDown={keyPress}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}

            {}
            <DeleteIcon onClick={remove} />
          </h2>

          <div>
         
              {threadContent !== null && toggle === true && (
                <TextEditor
                  save={save}
                  data={{ blocks: threadContent, entityMap: {} }}
                  actorUuid={"thread" + data.uuid}
                ></TextEditor>
              )}
              {threadContent !== null && toggle === false && (
                <TextEditor
                  save={save}
                  data={{ blocks: [], entityMap: {} }}
                  actorUuid={"thread" + data.uuid}
                ></TextEditor>
              )}
       

           </div>
        </div>
      )}
    </div>
  );
};

export default Thread;
