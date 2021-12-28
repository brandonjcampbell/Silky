import React from 'react';
import ActorList from "./ActorList"

const Tray = ({type}) => {
    return(
        <div>
               <ActorList type={type}></ActorList>
        </div>
    )
}

export default Tray