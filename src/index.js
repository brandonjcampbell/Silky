import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter, Route, Link } from "react-router-dom";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import logo from "./images/logo.svg";

import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import {
  ActorList,
  Web,
  CurrentProjectLink,
  App,
  Graph,
  SnippetTabs,
  Workspace,
  FactTabs,
  ThreadTabs,
  ElementTabs,
} from "./Components/";
import { TiScissors } from "react-icons/ti";
import {
  GiSpiderWeb,
  GiSewingString,
  GiLightBulb,
} from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import { StateProvider } from "./MyContext";

ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div className="Topbar">
          <Link to="/">
            <CurrentProjectLink></CurrentProjectLink>

            <img className="logo" src={logo} alt="silky" />
          </Link>

          <Link to="/elements">
            <HiPuzzle className="menuItem" />
          </Link>

          <Link to="/facts">
            {" "}
            <GiLightBulb className="menuItem" />
          </Link>

          <Link to="/snippets">
            <TiScissors className="menuItem" />
          </Link>

          <Link to="/threads">
            <GiSewingString className="menuItem" />
          </Link>

          <Link to="/webs">
            {" "}
            <GiSpiderWeb className="menuItem" />
          </Link>
        </div>

        <div className="App">
          <div className="Sidebar"></div>
          <div>
            <Route path="/" exact component={App} />
            <Route path="/Graph" exact component={Graph} />
            <Route
              path="/Elements"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="element" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.85}>
                      <div className="Workspace"></div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Elements/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="element" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.7}>
                      <div className="Workspace">
                        <Workspace actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.15}>
                      <div className="Extras">
                        <ElementTabs actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Facts"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="fact" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.85}>
                      <div className="Workspace"></div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Facts/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="fact" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.7}>
                      <div className="Workspace">
                        <Workspace actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.15}>
                      <div className="Extras">
                        <FactTabs actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Snippets"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="snippet" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.85}>
                      <div className="Workspace"></div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Snippets/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="snippet" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.7}>
                      <div className="Workspace">
                        <Workspace actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.15}>
                      <div className="Extras">
                        <SnippetTabs actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Threads"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="thread" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.85}>
                      <div className="Workspace"></div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route
              path="/Threads/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.15}>
                      <div className="List">
                        <ActorList {...props} type="thread" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.85}>
                      <div className="Workspace">
                        <ThreadTabs actorUuid={props.match.params.uuid} />
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />
            <Route path="/Webs" exact render={() => <Web></Web>} />
          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
