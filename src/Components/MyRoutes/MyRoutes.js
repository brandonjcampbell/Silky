import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import { store } from "../../NewContext";
import App from "../App";
import Shell from "../Shell";

const MyRoutes = () => {
  const globalState = useContext(store);
  const inProject = globalState.state.project !== "";

  return (
    <Routes>
      <Route path="/" element={inProject ? <Shell /> : <App />} />
      <Route path="/elements" element={inProject ? <Shell /> : <App />} />
      <Route path="/elements/:file" element={inProject ? <Shell /> : <App />} />
      <Route path="/analysis/:id" element={inProject ? <Shell /> : <App />} />
      <Route path="/wiki/*" element={inProject ? <Shell /> : <App />} />
      <Route path="/spinner" element={inProject ? <Shell /> : <App />} />
      <Route path="/spinner/settings" element={inProject ? <Shell /> : <App />} />
      <Route path="/map/:mapId" element={inProject ? <Shell /> : <App />} />
      <Route path="/timeline/:tlId" element={inProject ? <Shell /> : <App />} />
      <Route path="/preferences" element={inProject ? <Shell /> : <App />} />
      <Route path="/about" element={inProject ? <Shell /> : <App />} />
      <Route path="/write" element={<Navigate to="/" replace />} />
      <Route path="*" element={<App />} />
    </Routes>
  );
};

export default MyRoutes;
