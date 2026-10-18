import React, { useContext, useEffect, useState } from "react";
import { store } from "../../NewContext";
import { useLocation, useParams } from "react-router-dom";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import "react-reflex/styles.css";
import ActorList from "../ActorList";
import Workspace from "../Workspace";
import TabBar from "../TabBar";
import Analysis from "../Analysis";
import Wiki from "../Wiki";
import Spinner from "../Spinner";
import MapView from "../MapView";
import TimelineView from "../TimelineView";
import FlowPage from "../FlowPage";
import FlowToasts from "../Flow";
import { useMobile } from "../../useMobile";
import "./Shell.css";

/** Sidebar + editor pane. On narrow screens the sidebar is a drawer. */
const Shell = () => {
  const { file, id, mapId, tlId } = useParams();
  const pathname = useLocation().pathname;
  const isWiki = pathname.startsWith("/wiki");
  const isSpinner = pathname.startsWith("/spinner");
  const [, setRefresh] = useState(0);
  const doRefresh = (v) => setRefresh(v);
  const mobile = useMobile();
  const { state } = useContext(store);
  // nothing open means the writing page, so there is always content — even on a phone
  const hasContent = true;
  // on a phone the list shows when nothing is open, and as a drawer otherwise
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { setDrawer(false); }, [pathname]);
  // Flow mode changes the model behind the scenes; re-render when it does
  useEffect(() => {
    const on = () => setRefresh(Date.now());
    window.addEventListener("silky-flow-changed", on);
    return () => window.removeEventListener("silky-flow-changed", on);
  }, []);

  const editor = (
    <div className="editorPane">
      <TabBar onMenu={mobile ? () => setDrawer(true) : undefined} />
      {isSpinner ? (
        <div className="Workspace"><Spinner /></div>
      ) : isWiki ? (
        <div className="Workspace"><Wiki /></div>
      ) : mapId ? (
        <div className="Workspace"><MapView /></div>
      ) : tlId ? (
        <div className="Workspace"><TimelineView /></div>
      ) : id ? (
        <div className="Workspace"><Analysis /></div>
      ) : file ? (
        <div className="Workspace"><Workspace setRefresh={doRefresh} /></div>
      ) : (
        <div className="Workspace"><FlowPage embedded setRefresh={doRefresh} /></div>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="View View--mobile">
        <FlowToasts dir={state.dir} project={state.project} />
        {!hasContent || drawer ? (
          <div
            className={"left-pane mobileList" + (drawer ? " is-drawer" : "")}
            onClick={(e) => {
              // any pick from the drawer closes it — including re-picking what is already open
              const a = e.target.closest && e.target.closest("a[href]");
              if (a && drawer && !a.closest(".activityBar")) setDrawer(false);
            }}
          >
            <div className="List"><ActorList setRefresh={doRefresh} /></div>
          </div>
        ) : null}
        {drawer && <button type="button" className="mobileScrim" aria-label="Close list" onClick={() => setDrawer(false)} />}
        {hasContent && editor}
      </div>
    );
  }

  return (
    <div className="View">
      <FlowToasts dir={state.dir} project={state.project} />
      <ReflexContainer orientation="vertical">
        <ReflexElement className="left-pane" flex={0.2} minSize={200}>
          <div className="List"><ActorList setRefresh={doRefresh} /></div>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement className="middle-pane" flex={0.8}>{editor}</ReflexElement>
      </ReflexContainer>
    </div>
  );
};

export default Shell;
