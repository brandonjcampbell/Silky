import React, { useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _ from "lodash";
import { Link } from "react-router-dom";
import DeleteIcon from "@material-ui/icons/Delete";
import CloseIcon from "@material-ui/icons/Close";
import TextField from "@material-ui/core/TextField";
import Avatar from "@mui/material/Avatar";
import { store } from "../../MyContext";
import { getDisplayName } from "../../utils";
import "./DraggableList.css";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle, HiTag } from "react-icons/hi";

const homedir = window.require("os").homedir();

const DraggableList = ({
  list,
  saveList,
  handleClick,
  onDrop,
  action,
  showCharacterCount = 100,
  showAvatar = true,
}) => {
  const globalState = useContext(store);

  function handleOnDragEnd(result) {
    let clone = _.cloneDeep(list);
    const [reorderedItem] = clone.splice(result.source.index, 1);
    clone.splice(result.destination.index, 0, reorderedItem);
    saveList(clone);
    onDrop();
  }

  function remove(uuid) {
    let clone = _.cloneDeep(list);
    clone = clone.filter((x) => x.uuid !== uuid);
    saveList(clone);
  }

  function goRenderLabel(x, index) {
    const displayName = getDisplayName(x.uuid, globalState);

    return (
      <div
        className={showAvatar ? "row showAvatar" : "row"}
        onClick={() => {
          handleClick(x);
        }}
      >
        <Link to={"/" + (x.type ? x.type : "snippet") + "s/" + x.uuid}>
          {showAvatar && (
            <Avatar
              alt=" "
              className="avatar"
              sx={{ bgcolor: x.color ? x.color : "grey" }}
              src={
                homedir +
                "\\.silky\\" +
                globalState.state.project +
                "\\" +
                x.uuid +
                ".png"
              }
            />
          )}
          {!showAvatar && x.type === "element" && (
            <HiPuzzle className="avatar" />
          )}
          {!showAvatar && (x.type === "fact" || x.type === "link") && (
            <GiLightBulb className="avatar" />
          )}
          {!showAvatar && x.type === "snippet" && (
            <TiScissors className="avatar" />
          )}
          {!showAvatar && x.type === "thread" && (
            <GiSewingString className="avatar" />
          )}
          {!showAvatar && x.type === "web" && (
            <GiSpiderWeb className="avatar" />
          )}
          {!showAvatar && x.type === "tag" && <HiTag className="avatar" />}

          {displayName.slice(0, showCharacterCount)}
          {displayName.length > showCharacterCount ? "..." : ""}
        </Link>
        {action === "remove" && (
          <CloseIcon
            className="draggableRemove"
            onClick={() => {
              remove(x.uuid);
            }}
          />
        )}
        {action === "delete" && <DeleteIcon />}
      </div>
    );
  }

  function content() {
    if (list) {
      return list.map((x, index) => {
        return (
          <Draggable key={x.uuid} draggableId={x.uuid} index={index}>
            {(provided) => (
              <div
                uuid={x.uuid}
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {goRenderLabel(x, index)}
              </div>
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
