import React, { useContext, useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { store } from "./MyContext";
import Thread from "./Thread";

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
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const actor = globalState.state.actors.find((x) => x.uuid === actorUuid);

  const save = (newContent) => {
    dispatch({
      action: "saveContent",
      payload: { uuid: actorUuid, content: newContent },
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
                  data={globalState.state.content.find((x) => x.uuid === actorUuid)}
                ></TextEditor>
          </div>

      )}
      {actor.type == "thread" && <Thread data={actor}></Thread>}
    </div>
  );
};

export default Workspace;
