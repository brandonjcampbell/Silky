import React, { useContext, useState, useEffect } from 'react';
import TextEditor from './TextEditor'
import { store } from './MyContext';
import Thread from './Thread'


function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const Workspace = ({actor})=>{ 
  
  const globalState = useContext(store);
  const { dispatch } = globalState;
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
    const [content,setContent] = useState()
    const [target,setTarget] = useState()

    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);

   

      
    }, []);
    
    const save=(newContent)=>{

      dispatch({ action: 'saveContent' ,  payload:{uuid:actor.uuid,content:newContent}})
    }



        return(
        <div style={{ height: windowDimensions.height-10, width:windowDimensions.width-500}}>
          {actor.name} {actor.uuid}
          {actor.type=="element" && <TextEditor save={save} data={globalState.state.content.find(x=>x.uuid===actor.uuid)}></TextEditor>}
          {actor.type=="thread" && <Thread data={actor}></Thread>}
        </div>
        )
      }
      

    export default Workspace;