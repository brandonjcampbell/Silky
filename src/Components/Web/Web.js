import Graph from "../Graph";
import { Navigate } from "react-router-dom";
import React, { useContext } from "react";
import { store } from "../../MyContext";

const Web = ({ type }) => {
  const globalState = useContext(store);
  return (
    <div>
      {globalState.state.project === "Silky" && <Navigate to="/" />}
      <Graph></Graph>
    </div>
  );
};

export default Web;
