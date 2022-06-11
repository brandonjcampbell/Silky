import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter, Route, Link, useLocation } from "react-router-dom";

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
  GraphSpace,
  SnippetTabs,
  Workspace,
  FactTabs,
  ThreadTabs,
  ElementTabs,
  LinkTabs,
  GraphTabs,
  LinkSpace,
} from "./Components/";
import { TiScissors } from "react-icons/ti";
import {
  GiSpiderWeb,
  GiSewingString,
  GiLightBulb,
  GiPendulumSwing,
} from "react-icons/gi";
import { HiPuzzle, HiTag } from "react-icons/hi";
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

          <Link to="/elements/">
            <span className="menuLabel">Elements</span>{" "}
            <HiPuzzle className="menuItem" />
          </Link>

          <Link to="/facts/">
            <span className="menuLabel">Reveals</span>{" "}
            <GiLightBulb className="menuItem" />
          </Link>

          <Link to="/snippets/">
            <span className="menuLabel">Snippets</span>{" "}
            <TiScissors className="menuItem" />
          </Link>

          <Link to="/threads/">
            <span className="menuLabel">Threads</span>{" "}
            <GiSewingString className="menuItem" />
          </Link>

          <Link to="/webs/">
            <span className="menuLabel">Webs</span>{" "}
            <GiSpiderWeb className="menuItem" />
          </Link>

          <Link to="/tags/">
            <span className="menuLabel">Tags</span>{" "}
            <HiTag className="menuItem" />
          </Link>
        </div>

        <div className="App">
          <div className="Sidebar"></div>
          <div>
            <Route path="/" exact component={App} />
            <Route path="/Graph" exact component={Graph} />

            <Route
              path={["/Elements/", "/Elements/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.25}>
                      <div className="List">
                        <ActorList {...props} type="element" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      <div className="Workspace">
                        {props.match.params.uuid && (
                          <Workspace actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                        {props.match.params.uuid && (
                          <ElementTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

            <Route
              path={["/Facts/", "/Facts/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane">
                      <ReflexContainer orientation="horizontal">
                        <ReflexElement className="left-pane" flex={0.75}>
                          <div className="List">
                            <ActorList
                              {...props}
                              type="fact"
                              showAvatar={false}
                            />
                          </div>
                        </ReflexElement>
                        <ReflexSplitter />
                        <ReflexElement className="left-pane" flex={0.25}>
                          <div className="List">
                            <ActorList
                              {...props}
                              type="link"
                              showAvatar={false}
                            />
                          </div>
                        </ReflexElement>
                      </ReflexContainer>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      <div className="Workspace">
                        {props.match.params.uuid && (
                          <Workspace
                            actorUuid={props.match.params.uuid}
                            showAvatar={false}
                          />
                        )}
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                        {props.match.params.uuid && (
                          <FactTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

            <Route
              path="/Links/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane">
                      <ReflexContainer orientation="horizontal">
                        <ReflexElement className="left-pane" flex={0.75}>
                          <div className="List">
                            <ActorList
                              {...props}
                              type="fact"
                              showAvatar={false}
                            />
                          </div>
                        </ReflexElement>
                        <ReflexSplitter />
                        <ReflexElement className="left-pane" flex={0.25}>
                          <div className="List">
                            <ActorList
                              {...props}
                              type="link"
                              showAvatar={false}
                            />
                          </div>
                        </ReflexElement>
                      </ReflexContainer>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      <div className="Workspace">
                        {props.match.params.uuid && (
                          <LinkSpace actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                        {props.match.params.uuid && (
                          <LinkTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

            <Route
              path={["/Snippets/", "/Snippets/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.25}>
                      <div className="List">
                        <ActorList
                          {...props}
                          type="snippet"
                          showAvatar={false}
                        />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      <div className="Workspace">
                        {props.match.params.uuid && (
                          <Workspace
                            actorUuid={props.match.params.uuid}
                            showAvatar={false}
                          />
                        )}
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                        {props.match.params.uuid && (
                          <SnippetTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

            <Route
              path={["/Threads/", "/Threads/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.25}>
                      <div className="List">
                        <ActorList {...props} type="thread" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.75}>
                      <div className="Workspace">
                        {props.match.params.uuid && (
                          <ThreadTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

            <Route
              path={["/Webs/", "/Webs/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.25}>
                      <div className="List">
                        <ActorList {...props} type="web" />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      {props.match.params.uuid && (
                        <div className="Workspace">
                          <GraphSpace
                            actorUuid={props.match.params.uuid}
                            showAvatar={false}
                          />
                        </div>
                      )}
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                        {props.match.params.uuid && (
                          <GraphTabs actorUuid={props.match.params.uuid} />
                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />



<Route
              path={["/Tags/", "/Tags/:uuid"]}
              exact
              render={(props) => (
                <div className="View">
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className="left-pane" flex={0.25}>
                      <div className="List">
                        <ActorList
                          {...props}
                          type="tag"
                          showAvatar={false}
                        />
                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="middle-pane" flex={0.5}>
                      <div className="Workspace">

                      </div>
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className="right-pane" flex={0.25}>
                      <div className="Extras">
                      {props.match.params.uuid && (
              
              <ActorList
              {...props}
        tag={props.match.params.uuid}
              showAvatar={false}
            />

                        )}
                      </div>
                    </ReflexElement>
                  </ReflexContainer>
                </div>
              )}
            />

          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
