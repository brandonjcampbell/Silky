import React, { useContext } from "react";
import logo from "../../images/logo.svg";
import { store } from "../../MyContext";
import { Redirect } from "react-router-dom";
import "./CurrentProjectLink.css";

const CurrentProjectLink = ({ type }) => {
  const globalState = useContext(store);
  return (
    <div className="wrapper">
      {globalState.state.project === "Silky" && <Redirect to="/" />}
      {globalState.state.project}
      <img className="logo" src={logo} alt="silky" />
    </div>
  );
};

export default CurrentProjectLink;