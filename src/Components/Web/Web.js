import Graph from "../Graph"
import {Redirect} from "react-router-dom";
import React, { useContext} from "react";
import { store } from "../../MyContext";


const Web = ({type}) => {
    const globalState = useContext(store);
    return(
        <div>
            {globalState.state.project==="Silky" && <Redirect to="/" />}
            <Graph></Graph>
        </div>
    )
}

export default Web