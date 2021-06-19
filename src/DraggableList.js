import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _ from "lodash";
import { Link } from "react-router-dom";
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ExtensionIcon from "@material-ui/icons/Extension";

const Thread = ({
  list,
  saveList,
  handleClick,
  getDisplayName,
  getType,
  onDrop,
  action,
}) => {
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

  function goRenderLabel(x) {

      return (
        <div
          style={{
            margin: "2px",
            color: "white",
            display: "flex",
            verticalAlign:"middle"
          }}
        >
       
           
           
          <div
            style={{
              padding: "2px",
          
            }}
            onClick={() => {
              handleClick(x);
            }}
          >
              
{(x.type ? x.type:"element")==="element" && <ExtensionIcon/>}
{(x.type ? x.type:"element")==="thread" && <LinearScaleIcon/>}
              <Link style={{color:"white",textDecoration:"none",position:"relative",top:"-5px",margin:"5px"}} to={"/"+(x.type ? x.type:"element")+"s/"+x.uuid}>
              {getDisplayName(x.uuid)}
              </Link>
              {action==="remove" && <CloseIcon onClick={()=>{remove(x.uuid)}}/>}
            {action==="delete" && <DeleteIcon/>}
          </div>
    
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
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {goRenderLabel(x)}
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
