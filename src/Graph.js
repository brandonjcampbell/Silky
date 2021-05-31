import React from 'react';
import Cytoscape from 'cytoscape';
import { store } from './MyContext';
import CytoscapeComponent from 'react-cytoscapejs'
import COSEBilkent from 'cytoscape-cose-bilkent';
import actorToCyto from './utils/graphUtils'

import { useState, useContext, useEffect } from 'react';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const Graph = ({type})=>{ 
  
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
    Cytoscape.use(COSEBilkent);
    const layout = { name: 'cose-bilkent' };

    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    

    const globalState = useContext(store);
    const axioms = []
    const content = actorToCyto(globalState.state.actors)
  
        return(
        <div style={{ height: windowDimensions.height, width:windowDimensions.width-200}}>
            {/* <ReactFlow elements={[...content,...axioms]} /> */}
            <CytoscapeComponent layout={layout} elements={[...content,...axioms]} style={ {height: windowDimensions.height, width:windowDimensions.width-200} } 
            
            stylesheet={[
              {
                selector: 'node',
                style: {
                 height:50,
                 width:50,
                  shape: 'circle',
                  label: "data(label)",
                  "text-halign":"center",
                  "text-valign": "center",
                  "color": "#fff",
      "text-outline-color": "#888",
      "text-outline-width": 3
                  
                }
              },
              {
                selector: 'edge',
                style: {
                  'width': 2,
                  'line-color': '#ccc',
                  'target-arrow-color': '#ccc',
                  'target-arrow-shape': "data(arrow)",
                  'curve-style': 'bezier'
                }
              },
              {
               selector: 'node[hyper>0]',
               style:{
                 color:"black",
                 width: 25,
                 height: 25,
                 backgroundColor:"white",
                 "text-outline-color" : "white",
                 "text-outline-width": 2
               }
              }
            ]}
            />
        </div>
        )
      }

    export default Graph;


