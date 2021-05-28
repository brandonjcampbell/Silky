import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Graph from './Graph';
import logo from './images/logo.svg'
import TextEditor from './TextEditor';
import { BrowserRouter, Route, Link } from "react-router-dom";
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import Characters from "./Characters"
import Settings from "./Settings"
import Tray from "./Tray"

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
                  <MenuItem><img src={logo} style={{height:"60%",width:"60%"}}/></MenuItem>
                  <MenuItem> 
                      <Link to="/links">Links</Link>
                  </MenuItem>
                  <MenuItem> 
                      <Link to="/characters">Characters</Link>
                  </MenuItem>
                    <MenuItem> 
                      <Link to="/settings">Settings</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/facts">Facts</Link>
                    </MenuItem>
                    <MenuItem> 
                      <Link to="/transformations">Transformations</Link>
                    </MenuItem>
                  <MenuItem> 
                    <Link to="/editor">Threads</Link>
                  </MenuItem>
                </Menu>
              </ProSidebar>
              </div>
              <div style={{backgroundColor:"#232323",height:"100vh",width:"100vw"}}>
                <Route path="/" exact component={App} />
                <Route path="/Graph" exact component={Graph} />
                <Route path="/Editor" exact component={TextEditor} />
                <Route path="/Characters" exact render={()=><Tray type="characters"></Tray>} />
                <Route path="/Settings" exact render={()=><Tray type="settings"></Tray>} />
                <Route path="/Links" exact render={()=><Tray type="link"></Tray>} />
                <Route path="/Facts" exact render={()=><Tray type="fact"></Tray>} />
                <Route path="/Transformations" exact render={()=><Tray type="transformation"></Tray>} />
              </div>
        </div>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>,
  document.getElementById('root')
);