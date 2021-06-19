import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";
import TextField from "@material-ui/core/TextField";
import Workspace from "./Workspace";
import DraggableList from "./DraggableList";
import _ from 'lodash'

const ActorList = ({ match, type }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const content = globalState.state.actors;
  const [name, setName] = useState("");
  const [active, setActive] = useState(match && match.params && match.params.uuid?{uuid:match.params.uuid}:null);
  const [count, setCount] = useState(1);


  const {
    params: { userId }
  } = match;
  console.log("match??", match.params.uuid)

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      dispatch({
        action: "add",
        for: type,
        payload: { name: name },
        class: "actor",
      });
      setName("");
    }
  };

  const handleRowClick = (row) => {
    setActive(row);
  };


  function getDisplayName(uuid) {
    return globalState.getDisplayName(
      globalState,
      globalState.find(globalState, uuid)
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          height: "200px",
          width: "250px",
          padding: "30px;",
        }}
      >
        <div>
          {" "}
          <h2>{type}</h2>
          <TextField
            style={{ color: "white" }}
            id="outlined-basic"
            variant="outlined"
            value={name}
            onKeyDown={keyPress}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <DraggableList
          list={content.filter((x) => x.type === type)}
          handleClick={handleRowClick}
          getDisplayName={getDisplayName}
          saveList={(e) => {
            dispatch({
              action: "saveActors",
              for: type,
              payload: { actors: e },
            });
          }}
          getType={(x)=>{
            return globalState.state.actors.find(y=>y.uuid === active.uuid).type+"s"
          }}
          onDrop={()=>console.log("not necessary")}
          reorderList={(e) => {
            dispatch({
              action: "reorderActors",
              for: type,
              payload: { actors: e },
            });
          }}
        ></DraggableList>
      </div>

      <div>{active && <Workspace actorUuid={active.uuid}></Workspace>}</div>
    </div>
  );
};
export default ActorList;
