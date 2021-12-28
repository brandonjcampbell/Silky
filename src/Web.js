import Graph from "./Graph"
import { BrowserRouter, Route, Link,Redirect, NavLink  } from "react-router-dom";
import React, { useContext, useState, useEffect } from "react";
import { store } from "./MyContext";

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