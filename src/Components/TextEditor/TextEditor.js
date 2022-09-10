import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor } from "react-draft-wysiwyg";
import { store } from "../../MyContext";
import "../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
import { AiFillSave } from "react-icons/ai";
import "./TextEditor.css";
import { getDisplayName } from "../../utils";
import empty from "./empty.json";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const TextEditor = ({ data, save, actorUuid, showAvatar }) => {
  const globalState = useContext(store);
  const prevAmount = usePrevious({ actorUuid, data });
  const [currentBlock, setCurrentBlock] = useState(null);
  const [editorState, setEditorState] = useState();
  const [dirty, setDirty] = useState(null);
  const [saving, setSaving] = useState(0);
  const [current,setCurrent] = useState(data+"");
  const initial = data;
  
  useEffect(() => {
    console.log("initial state")
      setEditorState(data);
      console.log(data)
  }, []);
  
  useEffect(()=>{
    console.log("rerender")
  })

  useEffect(() => {
    if (!prevAmount || (prevAmount && prevAmount.actorUuid !== actorUuid)) {
      console.log("changetab")
      setCurrentBlock(null);
      //setEditorState(EditorState.createWithContent(convertFromRaw(data && data.blocks ? data : empty)));
      
      setEditorState(data);
    }
  }, [actorUuid, data]);

  const onEditorStateChange = (e) => {
    setDirty(true);
    console.log(e)
    setCurrent(e.currentTarget.innerHTML);
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

      save(current);
      setDirty(null);
  }
  
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
        {/* <textarea value={editorState} onChange={onEditorStateChange}></textarea> */}
        <p contenteditable="true"  style={{
            height: showAvatar? "calc(100vh - 218px)" : "calc(100vh - 178px)",
            paddingRight: "15px",
            paddingLeft: "20px",
            color: "rgb(300, 300, 300)",
            backgroundColor: "rgb(69, 68, 71)",
            overflowY:"scroll",
            marginBottom: "0px",
          }} onInput={onEditorStateChange} dangerouslySetInnerHTML={{__html:initial}}></p>
        {/* <Editor
          editorStyle={{
            height: showAvatar? "calc(100vh - 218px)" : "calc(100vh - 178px)",
            paddingRight: "15px",
            paddingLeft: "20px",
            color: "rgb(300, 300, 300)",
            backgroundColor: "rgb(69, 68, 71)",
            marginBottom: "0px",
          }}
          editorState={editorState}
          onEditorStateChange={
            onEditorStateChange
          }
          blockStyleFn={myBlockStyleFn}
        ></Editor> */}
        {dirty && <AiFillSave className="unsaved"  onClick={()=>{goForIt()}}/>}
      
      </div>
    </div>
  );
};

export default TextEditor;