import React, { useState, useEffect, useRef, useContext } from "react";
import { store } from "../../MyContext";
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

      save(current,actorUuid);
      setDirty(null);
  }
  
  const myBlockStyleFn = (contentBlock) => {
    if (contentBlock && contentBlock.getKey().split(":")[0] === currentBlock) {
      return contentBlock.getKey().split(":")[0];
    }
  };

  return (
    <div className={"contentBlock"}>
              <div className="editingBlockBanner">
     
         <strong>{getDisplayName(actorUuid,globalState)}</strong>
        </div>
        {dirty && <AiFillSave className="unsaved"  onClick={()=>{goForIt()}}/>}
            
      <div style={{ backgroundColor: "rgb(69, 68, 71)" }}>

        {/* <textarea value={editorState} onChange={onEditorStateChange}></textarea> */}
        <p contenteditable="true"  style={{
            maxHeight: "none",//showAvatar? "calc(100vh - 218px)" : "calc(100vh - 208px)",
            padding:"10px",
            paddingRight: "10px",
            paddingLeft: "20px",
            color: "rgb(300, 300, 300)",
            overflowY:"scroll",
            margin:"0px",
            borderRadius:"2px"
          
          
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

      
      </div>
    </div>
  );
};

export default TextEditor;