import React, { useContext, useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { store } from "./MyContext";
import Thread from "./Thread";
import _ from "lodash"

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

const Workspace = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    console.log("workspace useeffect")
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const actor = globalState.state.actors.find((x) => x.uuid === actorUuid);

  const save = (newContent, key) => {

    const actor = _.cloneDeep(
      globalState.state.actors.find((x) => x.uuid === actorUuid)
    );

    //if(actor && actor.content){
    newContent.blocks = newContent.blocks.map((x,index)=>{
      x.key = actorUuid+":"+index
      return x
    })
  //}
  actor.content = newContent

   // actor.content = newContent
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  
  
  function getDisplayName(uuid) {
    return globalState.getDisplayName(
      globalState,
      globalState.find(globalState, uuid)
    );
  }


  return (
    <div
      style={{
        height: windowDimensions.height - 40,
        width: windowDimensions.width - 800,
      }}
    >
      {actor.type == "element" && (
        <div>
                <h1 style={{ color: "white" }}>Element: {getDisplayName(actorUuid)}</h1>
                <TextEditor
                  save={save}
                  data={globalState.state.actors.find((x) => x.uuid === actorUuid).content}
                  actorUuid={actorUuid}
                ></TextEditor>
          </div>

      )}
      {actor.type == "thread" && <Thread data={actor}></Thread>}
    </div>
  );
};

export default Workspace;
