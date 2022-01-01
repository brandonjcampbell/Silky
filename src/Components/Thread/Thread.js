import React, { useContext, useState, useEffect } from "react";
import TextEditor from "../TextEditor";
import { store } from "../../MyContext";
import _ from "lodash";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@mui/material/Avatar";
import { uploadPic } from "../../utils";
//import "./Thread.css";

const homedir = window.require("os").homedir();

const Thread = ({ actorUuid }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [freshener, setFreshener] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [toggle, setToggle] = useState(true);
  let actor = globalState.state.actors.find((x) => x.uuid === actorUuid);
  const [tags, setTags] = useState(actor && actor.tags ? actor.tags : "");
  const [saveCounter,setSaveCounter]=useState(0)

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
    setOutput(determineOutput());
    setToggle(false);
    setTimeout((x) => {
      setToggle(true);
    }, 0.1);
  }, [actor, actor.sequence,saveCounter]);

  const saveOne = (actor, blocks) => {
    console.log(blocks);
    let remappedBlocks = _.cloneDeep(blocks).map((x, index) => {
      x.key = actorUuid + ":" + index;
      return x;
    });
    actor.content = { blocks: remappedBlocks,  entityMap: {} };
    dispatch({
      action: "saveActor",
      payload: { actor: actor },
    });
  };

  const saveAll = (newContent) => {
    if (actor && actor.sequence) {
      let cloneContent = _.cloneDeep(newContent);
      let group = null;
      let latest = 0;
      let rerender = false;
      cloneContent.blocks.forEach(block=>{
        if (block.key && block.key.includes(":")){
          group = block.key.split(":")[0]
          latest = parseInt(block.key.split(":")[0])
        }else if (group){
          block.key=group+":"+(latest+1)
        }
     
      })

      actor.sequence.forEach((snippetSeq) => {
        const snippet = globalState.state.actors.find(
          (a) => a.uuid === snippetSeq.uuid
        );
        if (snippet) {
          let poss = cloneContent.blocks
            .filter((x, index) => 
             x.key.includes(snippet.uuid)
            )
            if(poss.length===0){
              poss=[
                {
                  "key": snippet.uuid+":0",
                  "text": "",
                  "type": "unstyled",
                  "depth": 0,
                  "inlineStyleRanges": [],
                  "entityRanges": [],
                  "data": {}
                }  
              ]
              rerender=true;
            }
            
          saveOne(snippet, poss);
        }
      });

      if(rerender){
        setSaveCounter(saveCounter+1)
      }
    }
    // 
  };

  const remove = () => {
    dispatch({
      action: "removeActor",
      payload: { uuid: actorUuid },
    });
  };

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const saveTitle = () => {
    setEditTitle(false);
    let clone = _.cloneDeep(actor);
    clone.name = title;
    dispatch({
      action: "saveActor",
      for: "thread",
      payload: { actor: clone },
    });
  };

  const renderTextEditor = () => {
    if (actor && toggle === true) {
      return (
        <div>
          <h2>
            <Avatar
              className="avatar"
              alt=" "
              sx={{ width: 100, height: 100 }}
              onClick={() => {
                uploadPic(actorUuid, globalState, setFreshener);
              }}
              src={
                homedir +
                "\\.silky\\" +
                globalState.state.project +
                "\\" +
                actorUuid +
                ".png?" +
                freshener
              }
            />
            <span className="title">
              <span
                onClick={() => {
                  setEditTitle(!editTitle);
                  setTitle(actor.name);
                }}
              >
                {!editTitle && actor.name}
              </span>
              {editTitle && (
                <TextField
                  autoFocus
                  sx={{ bgcolor: "white" }}
                  id="outlined-basic"
                  value={title}
                  onKeyDown={keyPress}
                  onBlur={() => {
                    saveTitle();
                  }}
                  onChange={(e) => setTitle(e.target.value)}
                />
              )}
            </span>
            <span className="delete">
              <DeleteIcon onClick={remove} />
            </span>
          </h2>
          <div className="editor">
           {actor && actor.sequence && <TextEditor
              save={saveAll}
              data={{
                blocks: output,
                entityMap: {},
              }}
              actorUuid={actorUuid}
            ></TextEditor>}
            {actor && !actor.sequence && <h3>Add snippets to this thread</h3>}
          </div>
        </div>
      );
    } else {
      return <div></div>;
    }
  };

  return <div className="workspace">{renderTextEditor()}</div>;
};
export default Thread;

// import React, { useContext, useState, useEffect } from "react";
// import { store } from "../../MyContext";
// import _ from "lodash";
// import TextField from "@mui/material/TextField";
// import TextEditor from "../TextEditor";
// import DeleteIcon from "@material-ui/icons/Delete";
// import { ColorPicker } from "material-ui-color";

// const Thread = ({ actorUuid }) => {
//   const globalState = useContext(store);
//   const data = globalState.state.actors.find((x) => x.uuid === actorUuid);
//   const { dispatch } = globalState;
//   function determineOutput() {
//     alert("what have we here?")
//     let output = [];
//     if (data.sequence) {
//       data.sequence.forEach((x, index) => {
//         const result = globalState.state.actors.find((y) => y.uuid === x.uuid);
//         const xz = result
//           ? result.content
//             ? result.content.blocks
//               ? result.content.blocks.map((z, zindex) => {
//                   z.key = x.uuid + ":" + zindex;
//                   return z;
//                 })
//               : []
//             : []
//           : [];

//         output = [...output, ...xz];
//       });
//       return output;
//     }
//     return [];
//   }

//   const [editTitle, setEditTitle] = useState(false);
//   const [title, setTitle] = useState("");
//   const [threadContent, setThreadContent] = useState(determineOutput());

//   function updateColor(color) {
//     console.log("doin update4color", color);
//     let clone = _.cloneDeep(data);
//     clone.color = "#" + color.hex;
//     dispatch({
//       action: "saveActor",
//       for: "thread",
//       payload: { actor: clone },
//     });
//   }

//   const remove = () => {
//     dispatch({
//       action: "removeActor",
//       payload: { uuid: data.uuid },
//     });
//   };

//   // useEffect(() => {
//   //   setThreadContent(determineOutput());
//   // }, [globalState.state.actors]);

//   const save = (newContent, key) => {
//     const actorKey = key.split(":")[0];
//     const actor = _.cloneDeep(
//       globalState.state.actors.find((x) => x.uuid === actorKey)
//     );
//     const actorContent = newContent.blocks.filter(
//       (x) => x.key.split(":")[0] === actorKey || !x.key.includes(":")
//     );
//     if (actor && actor.content) {
//       actor.content.blocks = actorContent;
//       dispatch({
//         action: "saveActor",
//         payload: { actor: actor },
//       });
//     }
//   };

//   const keyPress = (e) => {
//     if (e.keyCode === 13) {
//       setEditTitle(false);
//       let clone = _.cloneDeep(data);
//       clone.name = title;
//       dispatch({
//         action: "saveActor",
//         for: "thread",
//         payload: { actor: clone },
//       });
//     }
//     if (e.keyCode === 27) {
//       setEditTitle(false);
//     }
//   };

//   return (
//     <div>
//       {data && (
//         <div>
//           <h2>
//             <div>
//               <ColorPicker
//                 value={data.color ? data.color : "transparent"}
//                 hideTextfield
//                 onChange={(e) => updateColor(e)}
//               />
//             </div>

//             <span
//               onClick={() => {
//                 setEditTitle(!editTitle);
//                 setTitle(data.name);
//               }}
//             >
//               {!editTitle && data.name}
//             </span>

//             {editTitle && (
//               <TextField
//                 autoFocus
//                 id="outlined-basic"
//                 value={title}
//                 onKeyDown={keyPress}
//                 onChange={(e) => setTitle(e.target.value)}
//               />
//             )}

//             {}
//             <DeleteIcon onClick={remove} />
//           </h2>

//           <div>
//           {JSON.stringify(threadContent)}
//               {threadContent && (
//                 <TextEditor
//                   save={save}
//                   data={{ blocks: threadContent, entityMap: {} }}
//                   actorUuid={"thread" + data.uuid}
//                 ></TextEditor>
//               )}

//            </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Thread;
