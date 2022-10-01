import React, { useContext } from "react";
import { store } from "../../MyContext";
import { Navigate } from "react-router-dom";
import "./CurrentProjectLink.css";
import { useLocation } from 'react-router-dom'

const CurrentProjectLink = ({ type }) => {
  const globalState = useContext(store);
  const location = useLocation();
  console.log(location.pathname);

  return (
    <div className="wrapper">
      {location.pathname}
      {/* {globalState.state.project === "Silky" && <Navigate to="/" />}
      {globalState.state.project} */}
    </div>
  );
};

export default CurrentProjectLink;