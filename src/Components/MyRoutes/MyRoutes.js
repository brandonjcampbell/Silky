import React, { useContext, useState } from "react";
import { store } from "../../NewContext";

import { Route, Routes } from "react-router-dom";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import { ActorList, App, Workspace } from "../../Components";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";

const MyRoutes = () => {
  const globalState = useContext(store);
  const [refresh, setRefresh] = useState(0);

  function doRefresh(val) {
    setRefresh(val);
  }


  const renderDefault = () => {
    return (
      <div className="View">
        <ReflexContainer orientation="vertical">
          <ReflexElement className="left-pane" flex={0.2}>
            <div className="List">
              <ActorList type="element" />
            </div>
          </ReflexElement>
          <ReflexElement className="middle-pane" flex={0.8}>

          </ReflexElement>
        </ReflexContainer>
      </div>
    );
  };

  return (
    <Routes>
      {globalState.state.project === "" && <Route path="/" element={<App />} />}
      {globalState.state.project !== "" && (
        <Route path="/" element={renderDefault()} />
      )}

      <Route
        path="/elements/"
        element={
          <div className="View">
            <ReflexContainer orientation="vertical">
              <ReflexElement className="left-pane" flex={0.2}>
                <div className="List">
                  <ActorList type="element" />
                </div>
              </ReflexElement>
              <ReflexElement className="middle-pane" flex={0.8}>
 
              </ReflexElement>
            </ReflexContainer>
          </div>
        }
      />

      <Route
        path="/elements/:file"
        exact
        element={
          <div className="View">
            <ReflexContainer orientation="vertical">
              <ReflexElement className="left-pane" flex={0.2}>
                <div className="List">
                  <ActorList
                    type="element"
                    setRefresh={(val) => doRefresh(val)}
                  />
                </div>
              </ReflexElement>
              <ReflexSplitter />
              <ReflexElement className="middle-pane" flex={0.8}>
                <div className="Workspace">
                  <Workspace setRefresh={(val) => doRefresh(val)} />
                </div>
              </ReflexElement>
            </ReflexContainer>
          </div>
        }
      />

      <Route path="*" element={<App />} />
    </Routes>
  );
};

export default MyRoutes;
