import React, { useContext } from 'react';
import AxiomList from "./AxiomList"

const AxiomTray = ({type}) => {
    return(
        <div style={{display:"flex"}}>
               <AxiomList type={type}></AxiomList>
               <div>
                   {type} WORKSPACE
               </div>
        </div>
    )
}

export default AxiomTray