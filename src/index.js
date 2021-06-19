import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Graph from "./Graph";
import logo from "./images/logo.svg";
import TextEditor from "./TextEditor";
import { BrowserRouter, Route, Link } from "react-router-dom";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import ActorList from "./ActorList";
import AxiomList from "./AxiomList";
import Web from "./Web";
import Tags from "./Tags";
import CurrentProjectLink from "./CurrentProjectLink";
import ExtensionIcon from "@material-ui/icons/Extension";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import LabelIcon from "@material-ui/icons/LocalOffer";
import LanguageIcon from "@material-ui/icons/Language";

import { StateProvider } from "./MyContext";

ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div style={{ padding: "10px", backgroundColor: "#121212" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            {" "}
            <CurrentProjectLink></CurrentProjectLink>
          </Link>

          <img
            src={logo}
            alt="silky"
            style={{
              height: "13%",
              width: "13%",
              position: "absolute",
              bottom: "10px",
              right: "20px",
            }}
          />
        </div>

        <div
          className="App"
          style={{ display: "flex", backgroundColor: "green" }}
        >
          <div style={{ backgroundColor: "red" }}>
            <ProSidebar
              collapsed={false}
              width="70px"
              onToggle={(tog) => {
                alert("sup");
              }}
            >
              <Menu iconShape="circle">
                <MenuItem icon={<ExtensionIcon />}>
                  <Link to="/elements">Elements</Link>
                </MenuItem>
                <MenuItem icon={<LabelIcon />}>
                  <Link to="/tags">Tags</Link>
                </MenuItem>
                <MenuItem icon={<LinearScaleIcon />}>
                  <Link to="/threads">Threads</Link>
                </MenuItem>
                <MenuItem icon={<LanguageIcon />}>
                  <Link to="/webs">Webs</Link>
                </MenuItem>
              </Menu>
            </ProSidebar>
          </div>
          <div
            style={{
              backgroundColor: "#232323",
              height: "calc( 100vh - 47px)",
              width: "100vw",
            }}
          >
            <Route path="/" exact component={App} />
            <Route path="/Graph" exact component={Graph} />
            <Route
              path="/Editor"
              exact
              render={() => <ActorList type="element"></ActorList>}
            />
            <Route
              path="/Elements"
              exact
              render={(props) => (
                <ActorList {...props} type="element"></ActorList>
              )}
            />
            <Route
              path="/Elements/:uuid"
              exact
              render={(props) => (
                <ActorList {...props} type="element"></ActorList>
              )}
            />

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
                <ActorList {...props} type="thread"></ActorList>
              )}
            />

            <Route path="/Tags" exact render={() => <Tags></Tags>} />
            {/* <Route path="/Objects" exact render={()=><ActorList type="object"></ActorList>} />
                <Route path="/Settings" exact render={()=><ActorList type="setting"></ActorList>} /> */}
            <Route
              path="/Facts"
              exact
              render={() => <AxiomList type="fact"></AxiomList>}
            />
            {/* <Route path="/Facts" exact render={()=><ActorList type="fact"></ActorList>} />
                <Route path="/Events" exact render={()=><ActorList type="event"></ActorList>} />
                <Route path="/Scenes" exact render={()=><ActorList type="scene"></ActorList>} />
                <Route path="/States" exact render={()=><ActorList type="state"></ActorList>} /> */}
            {/* <Route path="/Transformations" exact render={()=><ActorList type="transformation"></ActorList>} /> */}
            <Route path="/Webs" exact render={() => <Web></Web>} />
          </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
