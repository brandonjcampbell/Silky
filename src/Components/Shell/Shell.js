import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import "react-reflex/styles.css";
import ActorList from "../ActorList";
import Workspace from "../Workspace";
import TabBar from "../TabBar";
import logo from "../../images/logo.svg";

/** Sidebar + editor pane. The editor pane carries the open tabs. */
const Shell = () => {
  const { file } = useParams();
  const [, setRefresh] = useState(0);
  const doRefresh = (v) => setRefresh(v);

  return (
    <div className="View">
      <ReflexContainer orientation="vertical">
        <ReflexElement className="left-pane" flex={0.2} minSize={200}>
          <div className="List">
            <ActorList setRefresh={doRefresh} />
          </div>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement className="middle-pane" flex={0.8}>
          <div className="editorPane">
            <TabBar />
            {file ? (
              <div className="Workspace">
                <Workspace setRefresh={doRefresh} />
              </div>
            ) : (
              <div className="editorPane__empty">
                <div>
                  <img className="logo" src={logo} alt="" />
                  Pick something from the list, or make something new.
                </div>
              </div>
            )}
          </div>
        </ReflexElement>
      </ReflexContainer>
    </div>
  );
};

export default Shell;
