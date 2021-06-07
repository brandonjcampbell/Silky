import React, { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';

const TextEditor = ({data,save}) => {
  

    useEffect(() => {

        setEditorState(EditorState.createWithContent(contentState))
        
      }, [data]);

    const empty={"entityMap":{},"blocks":[{"key":"637gr","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]}
    console.log("rerender the text editor", !!data)
    const contentState = convertFromRaw(data?data.data:empty)

    const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState))
    const onEditorStateChange = (editorState) => {
        setEditorState(editorState);
       //save(convertToRaw(editorState._immutable.currentContent))
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