import React, { useContext } from "react";
import logo from "../../images/logo.svg";
import { store } from "../../MyContext";
import { Redirect } from "react-router-dom";

const CurrentProjectLink = ({ type }) => {
  const globalState = useContext(store);
  return (
    <div>
      {globalState.state.project === "Silky" && <Redirect to="/" />}
      <img src={logo} alt="silky" />
      {globalState.state.project}
    </div>
  );
};

export default CurrentProjectLink;