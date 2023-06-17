import React, { useContext, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _ from "lodash";
import { store } from "../../NewContext";
import "./DraggableList.css";
import saveFile from "../../utils/saveFile";
import moveFile from "../../utils/moveFile";
import { Link } from "react-router-dom";
import { TiScissors } from "react-icons/ti";
import {
  GiSpiderWeb,
  GiSewingString,
  GiLightBulb,
} from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";

const homedir = window.require("os").homedir();

const DraggableList = ({
  list,
  onDrop,
  action,
  showCharacterCount = 100,
  showAvatar = true,
  actorUuid,
}) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  function handleOnDragEnd(result) {
    if (result && result.source && result.destination) {
      const moving = list[result.source.index];
      const to = list[result.destination.index];
      if (result.destination.index === 0) {
        moving.order = to.order - 1;
      } else if (result.destination.index === list.length - 1) {
        moving.order = to.order + 1;
      } else {
        let toTwo;
        if (result.source.index > result.destination.index) {
          toTwo = list[result.destination.index - 1];
        } else {
          toTwo = list[result.destination.index + 1];
        }
        moving.order = (to.order + toTwo.order) / 2;
      }
      saveFile(globalState.state.dir + moving.file, moving);
    }
    onDrop();
  }

  // function remove(file) {
  //   moveFile(
  //     globalState.state.dir + file,
  //     globalState.state.dir + "rubbish\\" + file
  //   );
  //   console.log("time to refresh!");
  //   onDrop();
  // }
function determineIcon(element){
  if(!showAvatar) return null
  if(element.type==="element"){
    return <HiPuzzle/>
  }
  if(element.type==="fact"){
    return <GiLightBulb/>
  }
  if(element.type==="snippet"){
    return <TiScissors/>
  }
  if(element.type==="thread"){
    return <GiSewingString/>
  }

  if(element.type==="web"){
    return <GiSpiderWeb/>
  }
}
  function content() {
    if (list) {
      return list.map((x, index) => {
        return (
          <Draggable key={x.uuid} draggableId={x.uuid + ""} index={index}>
            {(provided) => (
              <Link to={`/elements/${x.file}`}>
                <div
                  className={
                    x.file === globalState.state.activeElement
                      ? "row selectedRow"
                      : "row"
                  }
                  uuid={x.uuid}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  onClick={() => {
                    dispatch({
                      action: "setActiveElement",
                      payload: { file: x.file },
                    });
                  }}
                >
                  {determineIcon(x)} {x.icon} {x.name}
                </div>
              </Link>
            )}
          </Draggable>
        );
      });
    }
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="snippets">
        {(provided) => (
          <div
            className="snippets"
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

export default DraggableList;
