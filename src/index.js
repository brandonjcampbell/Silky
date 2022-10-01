import React from "react";
import ReactDOM from "react-dom";

import {
  BrowserRouter,
  Route,
  Routes,
  Link,
  useParams,
} from "react-router-dom";

import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";

import "react-reflex/styles.css";
import logo from "./images/logo.svg";

import "react-pro-sidebar/dist/css/styles.css";
import "./index.css";
import {
  ActorList,
  CurrentProjectLink,
  App,
  LinkGraphSpace,
  SnippetTabs,
  Workspace,
  FactTabs,
  ThreadTabs,
  Thread,
  ElementTabs,
} from "./Components/";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle} from "react-icons/hi";
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
            <span className="menuLabel">Facts</span>{" "}
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

          <Link to="/spider/">
            <span className="menuLabel">Spider Mode</span>{" "}
            <GiSpiderWeb className="menuItem" />
          </Link>
        </div>

        <div className="App">
          <div className="Sidebar"></div>
          <div>
            <Routes>
              <Route path="/" element={<App />} />

              <Route
                path="/elements/"
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="element" />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/facts/"
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="fact" />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/snippets/"
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.2}>
                        <div className="List">
                          <ActorList type="snippet" />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/threads/"
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.2}>
                        <div className="List">
                          <ActorList type="thread" />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/elements/:uuid"
                exact
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="element" />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="middle-pane" flex={0.55}>
                        <div className="Workspace">
                          <Workspace />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="right-pane" flex={0.25}>
                        <div className="Extras">
                          <ElementTabs />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/facts/:uuid"
                exact
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="fact" />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="middle-pane" flex={0.55}>
                        <div className="Workspace">
                          <Workspace />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="right-pane" flex={0.25}>
                        <div className="Extras">
                          <FactTabs />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/snippets/:uuid"
                exact
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="snippet" />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="middle-pane" flex={0.55}>
                        <div className="Workspace">
                          <Workspace />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="right-pane" flex={0.25}>
                        <div className="Extras">
                          <SnippetTabs />
                        </div>
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/threads/:uuid"
                exact
                element={
                  <div className="View">
                    <ReflexContainer orientation="vertical">
                      <ReflexElement className="left-pane" flex={0.20}>
                        <div className="List">
                          <ActorList type="thread" />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="middle-pane" flex={0.55}>
                        <div className="Workspace">
                          <Thread />
                        </div>
                      </ReflexElement>
                      <ReflexSplitter />
                      <ReflexElement className="right-pane" flex={0.25}>
                          <ThreadTabs className="Extras" />
                      </ReflexElement>
                    </ReflexContainer>
                  </div>
                }
              />

              <Route
                path="/spider/"
                exact
                element={
                  <div className="View">
                    <LinkGraphSpace showAvatar={false} />
                  </div>
                }
              />

              <Route
                path="*"
                element={
                  <main style={{ padding: "1rem" }}>
                    <p>There's nothing here!</p>
                  </main>
                }
              />
            </Routes>

          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
