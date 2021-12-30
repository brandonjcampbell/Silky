import React, { useContext, useState } from "react";
import { store } from "../../MyContext";
import _ from "lodash";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import FormDialog from "../FormDialog";
import DraggableList from "../DraggableList";
import { getDisplayName } from "../../utils";
const homedir = window.require("os").homedir();

const ThreadTabs = ({ actorUuid }) => {
  const globalState = useContext(store);
  const data = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const { dispatch } = globalState;
  const [toggle, setToggle] = useState(true);

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



  return (
    <div>
      {data && (
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
                dispatch({
                  action: "saveActor",
                  for: "thread",
                  payload: { actor: clone },
                });
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
                      .map((m) => getDisplayName(m.uuid, globalState))
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
              sx={{ width: 200, bgcolor: "white", borderRadius: "4px" }}
              onChange={(e, newValue) => {
                if (newValue && newValue !== "Select") {
                  addToThread(newValue.uuid);
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
      )}
    </div>
  );
};

export default ThreadTabs;
