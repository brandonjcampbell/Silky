import React, { useContext } from "react";
import { store } from "../../MyContext";
import { Redirect } from "react-router-dom";
import "./CurrentProjectLink.css";

const CurrentProjectLink = ({ type }) => {
  const globalState = useContext(store);
  return (
    <div className="wrapper">
      {globalState.state.project === "Silky" && <Redirect to="/" />}
      {globalState.state.project}
    </div>
  );
};

export default CurrentProjectLink;