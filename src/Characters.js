import React, { useContext } from 'react';
import List from "./List"
import { store } from './MyContext';

const Characters = () => {
    const globalState = useContext(store);
    const { dispatch } = globalState;

    

    return(
        <div style={{display:"flex"}}>
               <List type="character"></List>
               <div>
                   Characters WORKSPACE
               </div>
        </div>

    )
}

export default Characters