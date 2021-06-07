import React, { useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import loadFile from "./utils/loadFile"
import saveFile from "./utils/saveFile"

const TextEditor = () => {


      
      const content =   loadFile('C:\\Users\\KelLynn\\Desktop\\Silky\\silky.json')


    const [contentState, setContentState] = useState(convertFromRaw(content))
    const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState))
    const onEditorStateChange = (editorState) => {
        setEditorState(editorState);
        console.log(editorState, "yaya")
        saveFile('C:\\Users\\KelLynn\\Desktop\\Silky\\silky.json',convertToRaw(editorState._immutable.currentContent))
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