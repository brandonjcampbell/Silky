import React, { useContext } from 'react';
import ActorList from "./ActorList"
import Graph from "./Graph"

const Tray = ({type}) => {
    return(
        <div style={{display:"flex"}}>
               <ActorList type={type}></ActorList>
       
        </div>
    )
}

export default Tray