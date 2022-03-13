import React, { useContext, useState, useEffect,useRef } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
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
            ? result.content.blocks
              ? result.content.blocks.map((z, zindex) => {
                  z.key = x.uuid + ":" + zindex;
                  return z;
                })
              : []
            : []
          : [];

        output = [...output, ...xz];
      });
      return output;
    }
    return [];
  };

  const [output, setOutput] = useState(determineOutput());

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




  const saveOne = (actor, blocks) => {
    let remappedBlocks = blocks.map((x, index) => {
      x.key = actorUuid + ":" + index;
      return x;
    });
    actor.content = { blocks: remappedBlocks, entityMap: {} };
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  const saveAll = (newContent) => {
    if (actor && actor.sequence) {
      let cloneContent = newContent;//_.cloneDeep(newContent);
      let group = null;
      let latest = 0;
      let rerender = false;
      cloneContent.blocks.forEach((block) => {
        if (block.key && block.key.includes(":")) {
          group = block.key.split(":")[0];
          latest = parseInt(block.key.split(":")[0]);
        } else if (group) {
          block.key = group + ":" + (latest + 1);
        }
      });

      actor.sequence.forEach((snippetSeq) => {
        const snippet = globalState.state.actors.find(
          (a) => a.uuid === snippetSeq.uuid
        );
        if (snippet) {
          let poss = cloneContent.blocks.filter((x, index) =>
            x.key.includes(snippet.uuid)
          );
          if (poss.length === 0) {
            poss = [
              {
                key: snippet.uuid + ":0",
                text: "",
                type: "unstyled",
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
              },
            ];
            rerender = true;
          }

          saveOne(snippet, poss);
        }
      });

      if (rerender) {
        setSaveCounter(saveCounter + 1);
      }
    }
    //
  };



  const renderTextEditor = () => {
    if (actor && toggle === true) {
      return (
        <div>

          <div className="editor">
            {actor && actor.sequence && (
              <TextEditor
                save={saveAll}
                data={{
                  blocks: output,
                  entityMap: {},
                }}
                actorUuid={actorUuid}
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