import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
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
            {showAvatars && <Avatar
              alt=" "
              className="simpleListAvatar"
              sx={{ bgcolor: x.color ? x.color : "grey" }}
              src={
                homedir +
                "\\.silky\\" +
                globalState.state.project +
                "\\" +
                x.uuid +
                ".png"
              }
            />}

{!showAvatars && x.type === "element" && (
            <HiPuzzle className="avatar" />
          )}
          {!showAvatars && (x.type === "fact" || x.type === "link") && (
            <GiLightBulb className="avatar" />
          )}
          {!showAvatars && x.type === "snippet" && (
            <TiScissors className="avatar" />
          )}
          {!showAvatars && x.type === "thread" && (
            <GiSewingString className="avatar" />
          )}
          {!showAvatars && x.type === "web" && (
            <GiSpiderWeb className="avatar" />
          )}
          {!showAvatars && x.type === "tag" && <HiTag className="avatar" />}

            {getDisplayName(x.uuid,globalState)}
          </Link>
          {xAction && <CloseIcon className="simpleListXAction" onClick={() => xAction(x.uuid)} />}
        </div>
      ))}
    </div>
  );
};

export default SimpleList;
