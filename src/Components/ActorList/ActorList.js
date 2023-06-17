import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import "./ActorList.css";
import loadDir from "../../utils/loadDir";
import loadFile from "../../utils/loadFile";
import saveFile from "../../utils/saveFile";
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

  function handleDrop(result,list){
    if (result && result.source && result.destination) {
      const moving = list[result.source.index];
      const to = list[result.destination.index];
      if (result.destination.index === 0) {
        moving.order = to.order - 1;
      } else if (result.destination.index === list.length - 1) {
        moving.order = to.order + 1;
      } else {
        let toTwo;
        if (result.source.index > result.destination.index) {
          toTwo = list[result.destination.index - 1];
        } else {
          toTwo = list[result.destination.index + 1];
        }
        moving.order = (to.order + toTwo.order) / 2;
      }
      saveFile(globalState.state.dir + moving.file, moving);
      setRefresh(Date.now())
    }
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
          onDrop={(result,list) => handleDrop(result,list)}
        ></DraggableList>
      </div>
    </div>
  );
};
export default ActorList;
