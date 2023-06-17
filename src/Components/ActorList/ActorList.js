import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import "./ActorList.css";
import loadDir from "../../utils/loadDir";
import loadFile from "../../utils/loadFile";
import DraggableList from "../DraggableList";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Link } from "react-router-dom";
import logo from "../../images/logo.svg";

const ActorList = ({ setRefresh }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("element");
  const dirs = loadDir(globalState.state.dir).filter((x) =>
    x.includes(".element.")
  );


  const loadUp = (x) => {
    const file = loadFile(globalState.state.dir + x);
    return file;
  };

  function compareOrder(a, b) {
    return a.order - b.order;
  }

  return (
    <div className="ActorList">
      <div className="project">
        <Link to="/">
          <img className="logo" src={logo} alt="silky"  onClick={() => {
              dispatch({ action: "setProject", payload: { name: ""} });
            }}/>
        </Link>
        {globalState.state.project}
      </div>
      <HiOutlineGlobeAlt
        onClick={() => setType("")}
        className={type === "" ? "tab selected" : "tab"}
      />
      <HiPuzzle
        onClick={() => setType("element")}
        className={type === "element" ? "tab selected" : "tab"}
      />
      <GiLightBulb
        onClick={() => setType("fact")}
        className={type === "fact" ? "tab selected" : "tab"}
      />
      <TiScissors
        onClick={() => setType("snippet")}
        className={type === "snippet" ? "tab selected" : "tab"}
      />
      <GiSewingString
        onClick={() => setType("thread")}
        className={type === "thread" ? "tab selected" : "tab"}
      />
      <GiSpiderWeb
        onClick={() => setType("web")}
        className={type === "web" ? "tab selected" : "tab"}
      />

      <div className="content">
        <DraggableList
        showAvatar={type===""?true:false}
          list={dirs
            .map((x) => loadUp(x))
            .filter((y) => type === "" || y.type === type)
            .sort(compareOrder)}
          onDrop={(x) => setRefresh(Date.now())}
        ></DraggableList>
      </div>
    </div>
  );
};
export default ActorList;
