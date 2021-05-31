import React from 'react';




import { useState,  useEffect } from 'react';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const Workspace = ({actor})=>{ 
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    

        return(
        <div style={{ height: windowDimensions.height-10, width:windowDimensions.width-500}}>
        </div>
        )
      }
      

    export default Workspace;