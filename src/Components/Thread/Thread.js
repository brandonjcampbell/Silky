import React, { useContext, useState, useEffect,useRef } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
import TitleBar from "../TitleBar";

import _ from "lodash";

import "./Thread.css";

const homedir = window.require("os").homedir();

const Thread = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");

  const [toggle, setToggle] = useState(true);
  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  const [saveCounter, setSaveCounter] = useState(0);

  const determineOutput = () => {
    let output = [];
    if (actor && actor.sequence) {
      actor.sequence.forEach((x, index) => {
        const result = globalState.state.actors.find((y) => y.uuid === x.uuid);
        const xz = result
          ? result.content
            ? result.content
            : []
          : [];

        output = output + xz;
      });
      return output;
    }
    return [];
  };

  const [output, setOutput] = useState(determineOutput());
  console.log("output,",output)

  useEffect(() => {
    setTags(actor && actor.tags ? actor.tags : "");
  }, [actorUuid]);

  useEffect(() => {
    if((prevActor && actor.uuid===prevActor.uuid && actor.color !== prevActor.color)){

    }else{
    setOutput(determineOutput());

  
    setToggle(false);
    setTimeout((x) => {
      setToggle(true);
    }, 0.1);
  }

  }, [actor, saveCounter]);


  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const prevActor = usePrevious(actor)




  const save = (newContent, actorUuid) => {
    const result = globalState.state.actors.find((y) => y.uuid === actorUuid);
    result.content = newContent;

    dispatch({
      action: "saveActor",
      payload: { actor: result },
    });
  };


  const renderTextEditor = () => {
    if (actor && toggle === true) {
      return (
       <div>

  
        <TitleBar actor={actor}/>

          <div className="editor">
            {actor && actor.sequence && actor.sequence.map(x=>
              <TextEditor
                save={save}
                data={ globalState.state.actors.find((y) => y.uuid === x.uuid).content
           
                }
                actorUuid={x.uuid}
              ></TextEditor>
            )}
            {actor && !actor.sequence && <h3>Add snippets to this thread</h3>}
          </div>
          </div>
       
      );
    } else {
      return <div></div>;
    }
  };

  return <div className="threadspace">{renderTextEditor()}</div>;
};
export default Thread;