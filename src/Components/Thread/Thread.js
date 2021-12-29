import React, { useContext, useState, useEffect } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import FormDialog from "../FormDialog";
import DraggableList from "../DraggableList";
import TextEditor from "../TextEditor";
import DeleteIcon from "@material-ui/icons/Delete";
import { ColorPicker } from "material-ui-color";
import {getDisplayName} from "../../utils"
const homedir = window.require("os").homedir();

const Thread = ({ actorUuid }) => {

  const globalState = useContext(store);
  const data =  globalState.state.actors.find((x) => x.uuid === actorUuid);
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

  function addToThread(next) {
    let clone = _.cloneDeep(data);
    if (!clone.sequence) {
      clone.sequence = [];
    }
    clone.sequence.push({ uuid: next });
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

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

  const empty = {
    entityMap: {},
    blocks: [
      {
        key: "637gr",
        text: "",
        type: "unstyled",
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
  };

  useEffect(() => {
    setThreadContent(determineOutput());
  }, [data]);

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

  const redrawText = () => {
    setToggle(false);
    setTimeout((x) => {
      setToggle(true);
    }, 0.1);
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

  return (
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
        <div>
          {threadContent !== null && toggle === true && (
            <TextEditor
              save={save}
              data={{ blocks: determineOutput(), entityMap: {} }}
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

        <div>
          <h2>Sequence</h2>
          <div>
            <DraggableList
              list={data.sequence}
              saveList={(e) => {
                let clone = _.cloneDeep(data);
                clone.sequence = e;
                clone.totalSequenceLength = 0;
                clone.sequence.forEach((x, index) => {
                  x.consecutive = 0;
                  if (
                    x.incomingEdgeWeight === "0" &&
                    clone.sequence[index - 1]
                  ) {
                    x.consecutive = clone.sequence[index - 1].consecutive + 1;
                  }
                  clone.totalSequenceLength += parseInt(
                    (x.incomingEdgeWeight ? x.incomingEdgeWeight : 0) + ""
                  );
                });
                console.log(clone.sequence, clone.totalSequenceLength, "yeah");
                dispatch({
                  action: "saveActor",
                  for: "thread",
                  payload: { actor: clone },
                });
                redrawText();
              }}
              showCharacterCount={50}
              showEdgeWeights={true}
              action="remove"
              handleClick={(e) => {
                console.log("handled Click", e);
              }}
              getType={(x) => {
                return (
                  globalState.state.actors.find((y) => x.uuid === y.uuid).type +
                  "s"
                );
              }}
              onDrop={() => {
                redrawText();
              }}
            ></DraggableList>
          </div>
          <br />
          <FormControl variant="filled">
            <Autocomplete
              disablePortal
              clearOnBlur
              selectOnFocus
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
                (x) =>
                  x.type === "snippet" &&
                  x.uuid !== data.uuid &&
                  (!data.sequence ||
                    !data.sequence.map((y) => y.uuid).includes(x.uuid))
              )}
              sx={{ width: 600, bgcolor: "white", borderRadius: "4px" }}
              onChange={(e, newValue) => {
                if (newValue && newValue !== "Select") {
                  addToThread(newValue.uuid);
                  redrawText();
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
                <TextField {...params} label="Then..." />
              )}
            />
            <FormDialog type={"snippet"} specialOp={addToThread} />
          </FormControl>
        </div>
      </div>
    </div>
  );
};

export default Thread;
