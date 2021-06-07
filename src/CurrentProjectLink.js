import React, { useContext } from 'react';
import AxiomList from "./AxiomList"
import { store } from './MyContext';

const CurrentProjectLink = ({type}) => {
    const globalState = useContext(store);
    return(
        <div style={{fontWeight:"bold",fontSize:"20px",color:"white"}}>
               {globalState.state.project}
        </div>
    )
}

export default CurrentProjectLink