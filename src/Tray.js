import React, { useContext } from 'react';
import List from "./List"
import { store } from './MyContext';

const Tray = ({type}) => {
    const globalState = useContext(store);
    const { dispatch } = globalState;

    

    return(
        <div style={{display:"flex"}}>
               <List type={type}></List>
               <div>
                   {type} WORKSPACE
               </div>
        </div>

    )
}

export default Tray