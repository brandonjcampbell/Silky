import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Avatar from "../Avatar";
import { store } from "../../MyContext";
import CloseIcon from "@material-ui/icons/Close";
import {getDisplayName} from "../../utils";
import "./SimpleList.css";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle, HiTag } from "react-icons/hi";

const homedir = window.require("os").homedir();

const SimpleList = ({ list,xAction,type="threads",showAvatars=true }) => {
  const globalState = useContext(store);

  return (
    <div>
      {list.map((x) => (
        <div className="simpleListRow">
          <Link to={`/${type}/${x.uuid}`}>
         <Avatar small={true} actor={x}/>
          <span className="value">
          {getDisplayName(x.uuid,globalState)}
          </span>
          </Link>
          {xAction && <CloseIcon className="simpleListXAction" onClick={() => xAction(x.uuid)} />}
        </div>
      ))}
    </div>
  );
};

export default SimpleList;
