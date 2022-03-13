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
  FactTabs,
  Thread,
  ThreadTabs,
  ElementTabs,
} from "./Components/";
import { TiScissors } from "react-icons/ti";
import {
  GiSpiderWeb,
  GiSewingString,
  GiEmptyHourglass,
  GiTreasureMap,
  GiLightBulb
} from "react-icons/gi";
import {HiPuzzle} from "react-icons/hi"
import ExtensionIcon from "@material-ui/icons/Extension";

import { StateProvider } from "./MyContext";

ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div className="Topbar">
          <Link to="/">
            <CurrentProjectLink></CurrentProjectLink>
          </Link>
        </div>

        <div className="App">
          <div className="Sidebar">
            <ProSidebar collapsed={false} width="80px">
              <Menu iconShape="circle">
                <MenuItem icon={<HiPuzzle className="menuItem"/>}>
                  <Link to="/elements">Elements</Link>
                </MenuItem>
                <MenuItem icon={<GiLightBulb className="menuItem"/>}>
                  <Link to="/facts">Facts</Link>
                </MenuItem>
                <MenuItem  icon={<TiScissors className="menuItem"/>}>
                  <Link to="/snippets">Snippets</Link>
                </MenuItem>
                <MenuItem icon={<GiSewingString className="menuItem"/>}>
                  <Link to="/threads">Threads</Link>
                </MenuItem>
                <MenuItem icon={<GiSpiderWeb className="menuItem"/>}>
                  <Link to="/webs">Webs</Link>
                </MenuItem>
                {/* <MenuItem className="menuItem" icon={<GiEmptyHourglass />}>
                  <Link to="/Reports">Reports</Link>
                </MenuItem> */}
                {/* <MenuItem className="menuItem" icon={<GiTreasureMap />}>
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
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="element" />
                  </div>
                  <div className="Workspace">
                  </div>
                  <div className="Extras">
                  </div>
                </div>
              )}
            />
            <Route
              path="/Elements/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="element" />
                  </div>
                  <div className="Workspace">
                    <Workspace actorUuid={props.match.params.uuid} />
                  </div>
                  <div className="Extras">
                    <ElementTabs actorUuid={props.match.params.uuid} />
                  </div>
                </div>
              )}
            />
            <Route
              path="/Facts"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="fact" />
                  </div>
                  <div className="Workspace">
                  </div>
                  <div className="Extras">
                  </div>
                </div>
              )}
            />
            <Route
              path="/Facts/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="fact" />
                  </div>
                  <div className="Workspace">
                    <Workspace actorUuid={props.match.params.uuid} />
                  </div>
                  <div className="Extras">
                    <FactTabs actorUuid={props.match.params.uuid} />
                  </div>
                </div>
              )}
            />
            <Route
              path="/Snippets"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="snippet" />
                    <div className="Workspace">
                  </div>
                  <div className="Extras">
                  </div>
                  </div>
                </div>
              )}
            />
            <Route
              path="/Snippets/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="snippet" />
                  </div>
                  <div className="Workspace">
                    <Workspace actorUuid={props.match.params.uuid} />
                  </div>
                  <div className="Extras">
                    <SnippetTabs actorUuid={props.match.params.uuid} />
                  </div>
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
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="thread" />
                  </div>
                  <div className="Workspace">
                  </div>
                </div>
              )}
            />
            <Route
              path="/Threads/:uuid"
              exact
              render={(props) => (
                <div className="View">
                  <div className="List">
                    <ActorList {...props} type="thread" />
                  </div>
                  <div className="Workspace">
                  <ThreadTabs actorUuid={props.match.params.uuid} />
                   
                  </div>
                  <div className="Extras">
                    
                  </div>
                </div>
              )}
            />
            {/* <Route path="/Tags" exact render={() => <Tags></Tags>} /> */}
            {/* <Route path="/Reports" exact render={() => <Reports></Reports>} /> */}
            <Route path="/Webs" exact render={() => <Web></Web>} />
          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
