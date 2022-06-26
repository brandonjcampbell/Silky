import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Avatar from "../Avatar";
import { store } from "../../MyContext";
import CloseIcon from "@material-ui/icons/Close";
import {getDisplayName} from "../../utils";
import "./LopsidedList.css";

const homedir = window.require("os").homedir();

const LopsidedList = ({ list,xAction,type="threads",showAvatars=true, side="target" }) => {
  const globalState = useContext(store);

  return (
    <div>
      {list.map((x) => (
        <div className="lopsidedListRow">
          <Link to={`/${type}/${x.uuid}`}>
         <Avatar small={true} actor={x}/>
          <span className="value">
          {getDisplayName(side==="target"?x.targets[0]:x.subjects[0],globalState)}
          </span>
          </Link>
          {xAction && <CloseIcon className="LopsidedListXAction" onClick={() => xAction(x.uuid)} />}
        </div>
      ))}
    </div>
  );
};

export default LopsidedList;
