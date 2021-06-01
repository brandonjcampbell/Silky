import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Graph from './Graph';
import logo from './images/logo.svg'
import TextEditor from './TextEditor';
import { BrowserRouter, Route, Link } from "react-router-dom";
import { ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import ActorList from "./ActorList";
import AxiomList from "./AxiomList";
import Web from "./Web"

import { StateProvider } from './MyContext';
 
ReactDOM.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <div className="App" style={{display:"flex", backgroundColor:"green"}}>
              <div style={{backgroundColor:"red"}}>
              <ProSidebar collapsed={false}
              onToggle={(tog)=>{ alert("sup")}}
              >
                <Menu iconShape="circle">
                  <MenuItem><img src={logo} alt="silky" style={{height:"60%",width:"60%"}}/></MenuItem>
                  <MenuItem> 
                      <Link to="/elements">Elements</Link>
                  </MenuItem>
                  <MenuItem> 
                      <Link to="/facts">Facts</Link>
                  </MenuItem>
                  <MenuItem> 
                      <Link to="/tags">Tags</Link>
                  </MenuItem>
                  {/* <MenuItem> 
                      <Link to="/objects">Objects</Link>
                  </MenuItem>
                    <MenuItem> 
                      <Link to="/settings">Settings</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/facts">Facts</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/scenes">Scenes</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/events">Events</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/states">States</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/transformations">Transformations</Link>
                    </MenuItem> */}
                  <MenuItem> 
                    <Link to="/editor">Threads</Link>
                  </MenuItem>
                  <MenuItem> 
                    <Link to="/web">Web</Link>
                  </MenuItem>
                </Menu>
              </ProSidebar>
              </div>
              <div style={{backgroundColor:"#232323",height:"100vh",width:"100vw"}}>
                <Route path="/" exact component={App} />
                <Route path="/Graph" exact component={Graph} />
                <Route path="/Editor" exact component={TextEditor} />
                <Route path="/Elements" exact render={()=><ActorList type="element"></ActorList>} />
                <Route path="/Tags" exact render={()=><ActorList type="tag"></ActorList>} />
                {/* <Route path="/Objects" exact render={()=><ActorList type="object"></ActorList>} />
                <Route path="/Settings" exact render={()=><ActorList type="setting"></ActorList>} /> */}
                <Route path="/Facts" exact render={()=><AxiomList type="fact"></AxiomList>} />
                {/* <Route path="/Facts" exact render={()=><ActorList type="fact"></ActorList>} />
                <Route path="/Events" exact render={()=><ActorList type="event"></ActorList>} />
                <Route path="/Scenes" exact render={()=><ActorList type="scene"></ActorList>} />
                <Route path="/States" exact render={()=><ActorList type="state"></ActorList>} /> */}
                {/* <Route path="/Transformations" exact render={()=><ActorList type="transformation"></ActorList>} /> */}
                <Route path="/Web" exact render={()=><Web></Web>} />
              </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById('root')
);