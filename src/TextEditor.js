import React, { useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertFromRaw } from 'draft-js';
import loadFile from "./utils/loadFile"

const TextEditor = () => {

 loadFile()
      
      const content =  {"entityMap":{},"blocks":[{"key":"637gr","text":"bugbear.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]};


    const [contentState, setContentState] = useState(convertFromRaw(content))
    const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState))
    const onEditorStateChange = (editorState) => {
        setEditorState(editorState);
    };


    return(
        <div style={{display:"flex"}}>
            <div style={{margin:"20px", padding:"20px", minHeight:"300px", backgroundColor:"#343434", width:"8in", textAlign:"center", color:"white"}}>
            test
                <Editor  height="100vh" editorState={editorState} onEditorStateChange={(e)=>{ 
                    onEditorStateChange(e)
                }}>
                </Editor>  
            </div>
        </div>

    )
}

export default TextEditor