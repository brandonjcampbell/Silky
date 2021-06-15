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

const TextEditor = ({ data, save, actorUuid }) => {
  const prevAmount = usePrevious({ actorUuid, data });

  useEffect(() => {
    console.log("text editor useeffect fired");
    if (!prevAmount || (prevAmount && prevAmount.actorUuid !== actorUuid)) {
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [actorUuid, data]);

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

  const contentState = convertFromRaw(data && data.blocks ? data : empty);

  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(contentState)
  );

  const onEditorStateChange = (editorState) => {
    let currentBlock = editorState.getSelection()
    let currentBlockKey = editorState.getSelection().getStartKey();

    const newContent =  convertToRaw(editorState._immutable.currentContent)

    if (data && data.blocks) {

  
    if (currentBlockKey && !currentBlockKey.includes(":")) {
  
      const previousKey = editorState.getCurrentContent().getKeyBefore(currentBlockKey)
     
      const owner = previousKey.split(":")[0]
      const index = parseInt(previousKey.split(":")[1])
     //currentBlock.key = owner + ":"+(index+1)
     currentBlockKey =owner + ":"+(index+1)
     newContent.key = currentBlockKey
     console.log("try it",previousKey,currentBlockKey)
    }
  }
    setEditorState(editorState);

    save(
    newContent ,
      currentBlockKey,
      data
    );
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
