import React, { useContext } from 'react';
import AxiomList from "./AxiomList"
import logo from "./images/logo.svg";

import { store } from './MyContext';
import { BrowserRouter, Route, Link,Redirect, NavLink  } from "react-router-dom";


const CurrentProjectLink = ({type}) => {
    const globalState = useContext(store);
    return(
        <div style={{fontWeight:"bold",fontSize:"20px",color:"white"}}>
                        {globalState.state.project==="Silky" && <Redirect to="/" />}

               
          <img
            src={logo}
            alt="silky"
            style={{
                position:"absolute",
                top:"7px",
                right:"50px",
              height: "55px"
            }}
          /> {globalState.state.project}
        </div>
    )
}

export default CurrentProjectLink