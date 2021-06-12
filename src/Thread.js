import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _, { remove } from "lodash";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

const Thread = ({ data }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [next, setNext] = useState();

  function handleOnDragEnd(result) {
    let clone = _.cloneDeep(data);
    console.log("Before", clone);

    const [reorderedItem] = clone.sequence.splice(result.source.index, 1);
    clone.sequence.splice(result.destination.index, 0, reorderedItem);

    console.log("After", clone);

    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  function addToThread(next) {
    console.log("what is?", next);
    let clone = _.cloneDeep(data);
    if (!clone.sequence) {
      clone.sequence = [];
    }
    clone.sequence.push(next);
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  function removeFromThread(next) {
    console.log("what is?", next);
    let clone = _.cloneDeep(data);
    clone.sequence = clone.sequence.filter((x) => x !== next);
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  }

  function content() {
    if (data && data.sequence) {
      return data.sequence.map((x, index) => {
        return (
          <Draggable key={x} draggableId={x} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    margin: "10px",
                    padding: "10px",
                    maxWidth: "500px",
                  }}
                >
                  <button onClick={() => removeFromThread(x)}>X</button>
                  {globalState.getDisplayName(
                    globalState,
                    globalState.find(globalState, x)
                  )}
                </div>
              </div>
            )}
          </Draggable>
        );
      });
    }
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="elements">
        {(provided) => (
          <div>
            <h1 style={{"color":"white"}}>
              {globalState.getDisplayName(
                globalState,
                globalState.find(globalState, data.uuid)
              )}
            </h1>

            <div
              className="elements"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {content()}
              {provided.placeholder}
            </div>

            <FormControl variant="outlined">
              <InputLabel id="demo-simple-select-outlined-label">
                THEN
              </InputLabel>
              <Select
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={next}
                onChange={(e) => {
                  addToThread(e.target.value);
                }}
                label="Subject"
              >
                <MenuItem value="">
                  <em>Select</em>
                </MenuItem>
                {globalState.state.actors
                  .filter(
                    (x) =>
                      x.uuid !== data.uuid &&
                      (!data.sequence || !data.sequence.includes(x.uuid))
                  )
                  .map((x) => {
                    return (
                      <MenuItem value={x.uuid}>
                        {globalState.getDisplayName(globalState, x)}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Thread;
