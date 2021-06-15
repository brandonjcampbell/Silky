import React, { useState, useEffect, useRef } from "react";
import { Editor } from "react-draft-wysiwyg";
import "../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const TextEditor = ({ data, save }) => {
  const prevAmount = usePrevious({ data });



//   useEffect(() => {
//     // console.log("useeffect","data:",data, "prev:",prevAmount, "bools:",!data,!prevAmount,(prevAmount && !prevAmount.data), (data && prevAmount && prevAmount.data && prevAmount.data.uuid!==data.uuid))
// console.log("use effect",data,prevAmount)
//     //if there was no prior value or if the current uuid does not match the previous uuid, reload
//     if (
//       !data ||
//       !prevAmount ||
//       (prevAmount && !prevAmount.data) ||
//       (data && prevAmount.data && prevAmount.data.uuid !== data.uuid)
//     ){
  
//         setEditorState(EditorState.createWithContent(contentState))
        

//     }
//   }, [data]);
  

  useEffect(() => {
    // console.log("useeffect","data:",data, "prev:",prevAmount, "bools:",!data,!prevAmount,(prevAmount && !prevAmount.data), (data && prevAmount && prevAmount.data && prevAmount.data.uuid!==data.uuid))

//if there was no prior value or if the current uuid does not match the previous uuid, reload
   if((!data) || (!prevAmount)|| (prevAmount && !prevAmount.data) || (data && prevAmount.data && prevAmount.data.uuid!==data.uuid ) || (data && data.uuid==="thread")){
      setEditorState(EditorState.createWithContent(contentState))
   }
      
    }, [data]);

//   const empty={"entityMap":{},"blocks":[{"key":"637gr","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]}

//   const contentState = convertFromRaw(data && data.uuid ?data.data:empty)

//   const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState))
//   const onEditorStateChange = (editorState) => {
//       setEditorState(editorState);
//      save(convertToRaw(editorState._immutable.currentContent))
//   };

// }   , [data]);

  const empty = {
    entityMap: {},
    blocks: [
      {
        key: "637gr",
        text: "",
        type: "unstyled",
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
  };



  const contentState = convertFromRaw(data && data.uuid ? data.data : empty);

  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(contentState)
  );

  const onEditorStateChange = (editorState) => {
    setEditorState(editorState);
    save(convertToRaw(editorState._immutable.currentContent));
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          margin: "20px",
          padding: "20px",
          minHeight: "300px",
          backgroundColor: "#343434",
          width: "8in",
          textAlign: "center",
          color: "white",
        }}
      >
        <Editor
          height="100vh"
          editorState={editorState}
          onEditorStateChange={(e) => {
            onEditorStateChange(e);
          }}
        ></Editor>
      </div>
    </div>
  );
};

export default TextEditor;
