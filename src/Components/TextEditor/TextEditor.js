import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor } from "react-draft-wysiwyg";
import { store } from "../../MyContext";
import "../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
import { AiFillSave } from "react-icons/ai";
import "./TextEditor.css";
import { getDisplayName } from "../../utils";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const TextEditor = ({ data, save, actorUuid }) => {
  const globalState = useContext(store);

  const prevAmount = usePrevious({ actorUuid, data });
  const [currentBlock, setCurrentBlock] = useState(null);

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

  const [dirty, setDirty] = useState(0);

  const onEditorStateChange = (editorState) => {
    //let currentBlock = editorState.getSelection();
    let currentBlockKey = editorState.getSelection().getStartKey();
    setCurrentBlock(currentBlockKey.split(":")[0]);

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
    setDirty(true);
    setEditorState(editorState);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let currentBlockKey = editorState.getSelection().getStartKey();
      const newContent = convertToRaw(editorState._immutable.currentContent);
      save(newContent, currentBlockKey, data);
      setDirty(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [editorState]);


  const myBlockStyleFn = (contentBlock) => {
    if (contentBlock && contentBlock.getKey().split(":")[0] === currentBlock) {
      return contentBlock.getKey().split(":")[0];
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: "rgb(69, 68, 71)" }}>
       
<style>
{/* [data-offset-key] &#123;
          background:green;
          &#125; */}

          [href*={currentBlock}] &#123;
          background:green;
          &#125;
  </style>
          {currentBlock}
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
          blockStyleFn={myBlockStyleFn}
        ></Editor>
        {dirty && <AiFillSave className="unsaved" />}
      </div>
    </div>
  );
};

export default TextEditor;
