import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import "react-reflex/styles.css";
import ActorList from "../ActorList";
import Workspace from "../Workspace";
import TabBar from "../TabBar";
import Analysis from "../Analysis";
import Wiki from "../Wiki";
import Spinner from "../Spinner";
import logo from "../../images/logo.svg";

/** Sidebar + editor pane. The editor pane carries the open tabs. */
const Shell = () => {
  const { file, id } = useParams();
  const pathname = useLocation().pathname;
  const isWiki = pathname.startsWith("/wiki");
  const isSpinner = pathname.startsWith("/spinner");
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
            {isSpinner ? (
              <div className="Workspace">
                <Spinner />
              </div>
            ) : isWiki ? (
              <div className="Workspace">
                <Wiki />
              </div>
            ) : id ? (
              <div className="Workspace">
                <Analysis />
              </div>
            ) : file ? (
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
