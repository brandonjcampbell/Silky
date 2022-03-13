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
      setCurrentBlock(null);
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

  const [dirty, setDirty] = useState(null);
  const [saving, setSaving] = useState(0);

  const onEditorStateChange = (editorState) => {
    let currentBlockKey = editorState.getSelection().getStartKey();
    if (currentBlockKey) {
      setCurrentBlock(findRoot(editorState, currentBlockKey));
    }
    setDirty(true);
    setEditorState(editorState);
  };

  const findRoot = (editorState, blockKey) => {
    if (blockKey.includes(":")) {
      return blockKey.split(":")[0];
    } else {
      const previousKey = editorState
        .getCurrentContent()
        .getKeyBefore(blockKey);
      if (previousKey) {
        return findRoot(editorState, previousKey);
      } else {
        return blockKey;
      }
    }
  };

  const goForIt = ()=>{
      let currentBlockKey = editorState.getSelection().getStartKey();
      const newContent = convertToRaw(editorState._immutable.currentContent);
      save(newContent, currentBlockKey, data);
      setDirty(null);
  }

  // useEffect(() => {
  //   const delayDebounceFn = setTimeout(() => {
  //     let currentBlockKey = editorState.getSelection().getStartKey();
  //     const newContent = convertToRaw(editorState._immutable.currentContent);
  //     save(newContent, currentBlockKey, data);
  //     setDirty(false);
  //   }, 500);

  //   return () => {
  //     clearTimeout(delayDebounceFn);
  //   };
  // }, [editorState]);

  const myBlockStyleFn = (contentBlock) => {
    if (contentBlock && contentBlock.getKey().split(":")[0] === currentBlock) {
      return contentBlock.getKey().split(":")[0];
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: "rgb(69, 68, 71)" }}>
        <div className="editingBlockBanner">
         {currentBlock && <span>Currently Editing: <strong>{getDisplayName(currentBlock,globalState)}</strong></span>}
        </div>
        <Editor
          editorStyle={{
            height: "calc(100vh - 316px)",
            paddingRight: "15px",
            paddingLeft: "20px",
            color: "rgb(300, 300, 300)",
            backgroundColor: "rgb(69, 68, 71)",
            marginBottom: "0px",
          }}
          editorState={editorState}
          onEditorStateChange={(e) => {
            onEditorStateChange(e);
          }}
          blockStyleFn={myBlockStyleFn}
        ></Editor>
        {dirty && <AiFillSave className="unsaved"  onClick={()=>{goForIt()}}/>}
      
      </div>
    </div>
  );
};

export default TextEditor;
