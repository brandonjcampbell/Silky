import React, { useContext } from 'react';
import List from "./List"
import { store } from './MyContext';

const Settings = () => {
    const globalState = useContext(store);
    const { dispatch } = globalState;

    

    return(
        <div style={{display:"flex"}}>
               <List type="setting"></List>
               <div>
                   Settings WORKSPACE
               </div>
        </div>

    )
}

export default Settings