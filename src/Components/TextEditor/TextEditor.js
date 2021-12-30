import React, { useState, useEffect, useRef } from "react";
import { Editor } from "react-draft-wysiwyg";
import "../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
import { AiFillSave } from "react-icons/ai";
import "./TextEditor.css"

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

  const [strokeCount, setStrokeCount] = useState(0);
  const [dirty,setDirty] = useState(0);

  const onEditorStateChange = (editorState) => {
    let currentBlock = editorState.getSelection();
    let currentBlockKey = editorState.getSelection().getStartKey();

    const newContent = convertToRaw(editorState._immutable.currentContent);

    if (data && data.blocks) {
      if (currentBlockKey && !currentBlockKey.includes(":")) {
        const previousKey = editorState
          .getCurrentContent()
          .getKeyBefore(currentBlockKey);
        if (previousKey) {
          const owner = previousKey.split(":")[0];
          const index = parseInt(previousKey.split(":")[1]);
          currentBlockKey = owner + ":" + (index + 1);
          newContent.key = currentBlockKey;
        }
      }
    }
    setDirty(true)
    setEditorState(editorState);
  };


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let currentBlockKey = editorState.getSelection().getStartKey();
      const newContent = convertToRaw(editorState._immutable.currentContent);
      save(newContent, currentBlockKey, data);
      setDirty(false)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [editorState])

  return (
    <div>
      <div style={{ backgroundColor: "rgb(69, 68, 71)" }}>
        {dirty && <AiFillSave className="unsaved"/>}
        <Editor
          editorStyle={{
            height: "calc(100vh - 216px)",
            paddingRight: "15px",
            paddingLeft: "20px",
            color: "rgb(300, 300, 300)",
            backgroundColor: "rgb(69, 68, 71)",
            margin: "10px",
            marginBottom: "0px",
          }}
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
