import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _ from "lodash";

const Thread = ({
  list,
  saveList,
  handleClick,
  getDisplayName,
}) => {
  function handleOnDragEnd(result) {
    let clone = _.cloneDeep(list);
    const [reorderedItem] = clone.splice(result.source.index, 1);
    clone.splice(result.destination.index, 0, reorderedItem);
    saveList(clone);
  }

  function remove(uuid) {
    let clone = _.cloneDeep(list);
    clone = clone.filter((x) => x.uuid !== uuid);
    saveList(clone);
  }

  function content() {
    if (list) {
      return list.map((x, index) => {
        return (
          <Draggable key={x.uuid} draggableId={x.uuid} index={index}>
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
                    display:"flex"
                  }}
                >
                  <button onClick={() => remove(x.uuid)}>X</button>
                  <div
                    onClick={() => {
                      handleClick(x);
                    }}
                  >
                    {getDisplayName(x.uuid)}
                  </div>
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
          <div
            className="elements"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {content()}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Thread;
