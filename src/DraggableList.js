import React, { useContext} from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import _ from "lodash";
import { Link } from "react-router-dom";
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import CreateIcon from "@material-ui/icons/Create";
import ExtensionIcon from "@material-ui/icons/Extension";
import TextField from "@material-ui/core/TextField"
import Avatar from "@mui/material/Avatar";
import { store } from "./MyContext";
const homedir = window.require("os").homedir();


const Thread = ({
  list,
  saveList,
  handleClick,
  getDisplayName,
  getType,
  onDrop,
  action,
  showEdgeWeights,
  showCharacterCount=27
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

  function goRenderLabel(x,index) {

      return (
        <div
          style={{
            margin: "4px",
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

                            {showEdgeWeights && <TextField  value={x.incomingEdgeWeight}  onChange={(e)=>{ 
                              let cloned =_.cloneDeep(list)
                              cloned[index].incomingEdgeWeight = e.target.value
                              saveList(cloned)

                            }} style={{width:"55px",height:"40px",size:"6px",background:"white", borderRadius:"4px",marginRight:"10px"}}  size="small" label="" variant="outlined" />}


<Avatar
              alt=" "
              style={{display:"inline-block",}}
              sx={{  bgcolor:x.color?x.color:"grey" }}
              src={
                homedir +
                "\\.silky\\" +
                globalState.state.project +
                "\\" +
                x.uuid +
                ".png"
              }

            />



              <Link style={{color:"white",textDecoration:"none",position:"relative",top:"-5px",margin:"5px"}} to={"/"+(x.type ? x.type:"snippet")+"s/"+x.uuid}>

 {getDisplayName(x.uuid).slice(0,showCharacterCount)}{getDisplayName(x.uuid).length>showCharacterCount?"...":""}
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
                {goRenderLabel(x,index)}
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

export default Thread;
