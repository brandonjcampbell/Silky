import React from 'react';
import { Editor } from 'react-draft-wysiwyg';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import Graph from './Graph';

const TextEditor = () => {

    return(
        <div style={{display:"flex"}}>
                    <div style={{margin:"20px", padding:"20px", minHeight:"300px", backgroundColor:"#343434", width:"8in", textAlign:"center", color:"white"}}>
            <Editor  height="100vh"/>
          
        </div>
              <Graph></Graph>
        </div>

    )
}


export default TextEditor