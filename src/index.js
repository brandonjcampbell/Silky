import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Route, Link } from "react-router-dom";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import {
  ActorList,
  Web,
  Tags,
  CurrentProjectLink,
  App,
  Graph,
  Reports,
  SnippetTabs,
  Workspace,
  Thread,
  ElementTabs
} from "./Components/";
import { TiScissors } from "react-icons/ti";
import {
  GiSpiderWeb,
  GiSewingString,
  GiEmptyHourglass,
  GiTreasureMap,
} from "react-icons/gi";
import ExtensionIcon from "@material-ui/icons/Extension";

import { StateProvider } from "./MyContext";

ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div>
          <Link to="/">
            <CurrentProjectLink></CurrentProjectLink>
          </Link>
        </div>

        <div className="App">
          <div>
            <ProSidebar collapsed={false} width="70px">
              <Menu iconShape="circle">
                <MenuItem icon={<ExtensionIcon />}>
                  <Link to="/elements">Elements</Link>
                </MenuItem>
                <MenuItem icon={<TiScissors />}>
                  <Link to="/snippets">Snippets</Link>
                </MenuItem>
                <MenuItem icon={<GiSewingString />}>
                  <Link to="/threads">Threads</Link>
                </MenuItem>
                <MenuItem icon={<GiSpiderWeb />}>
                  <Link to="/webs">Webs</Link>
                </MenuItem>
                <MenuItem icon={<GiEmptyHourglass />}>
                  <Link to="/Reports">Reports</Link>
                </MenuItem>
                {/* <MenuItem icon={<GiTreasureMap />}>
                  <Link to="/maps">Maps</Link>
                </MenuItem> */}
              </Menu>
            </ProSidebar>
          </div>
          <div>
            <Route path="/" exact component={App} />
            <Route path="/Graph" exact component={Graph} />
            <Route
              path="/Elements"
              exact
              render={(props) => (
                <div>
                  <ActorList {...props} type="element"></ActorList>
                </div>
              )}
            />
            <Route
              path="/Elements/:uuid"
              exact
              render={(props) => (
                <div>
                  <ActorList {...props} type="element"></ActorList>
                  <Workspace actorUuid={props.match.params.uuid} />
                  <ElementTabs actorUuid={props.match.params.uuid} />

                </div>
              )}
            />
            <Route
              path="/Snippets"
              exact
              render={(props) => (
                <ActorList {...props} type="snippet"></ActorList>
              )}
            />
            <Route
              path="/Snippets/:uuid"
              exact
              render={(props) => (
                <div>
                  <ActorList {...props} type="snippet"></ActorList>
                  <Workspace actorUuid={props.match.params.uuid} />
                  <SnippetTabs actorUuid={props.match.params.uuid} />

                </div>
              )}
            />
            {/* <Route
              path="/Maps"
              exact
              render={(props) => <ActorList {...props} type="map"></ActorList>}
            /> */}
            {/* <Route
              path="/Maps/:uuid"
              exact
              render={(props) => (
                <div>
                  <ActorList {...props} type="map"></ActorList>
                  <Workspace actorUuid={props.match.params.uuid} />
                </div>
              )}
            /> */}
            <Route
              path="/Threads"
              exact
              render={(props) => (
                <ActorList {...props} type="thread"></ActorList>
              )}
            />
            <Route
              path="/Threads/:uuid"
              exact
              render={(props) => (
                <div>
                  <ActorList {...props} type="thread"></ActorList>
                  <Thread actorUuid={props.match.params.uuid} />
                </div>
              )}
            />
            <Route path="/Tags" exact render={() => <Tags></Tags>} />
            <Route path="/Reports" exact render={() => <Reports></Reports>} />
            <Route path="/Webs" exact render={() => <Web></Web>} />
          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
