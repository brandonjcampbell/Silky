import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Avatar from "../Avatar";
import { store } from "../../MyContext";
import CloseIcon from "@material-ui/icons/Close";
import { getDisplayName, actorIsValid } from "../../utils";
import "./SimpleList.css";

const homedir = window.require("os").homedir();

const SimpleList = ({
  list,
  xAction,
  type = "threads",
  showAvatars = true,
}) => {
  const globalState = useContext(store);

  return (
    <div>
      {list.map((x) => {
        if (actorIsValid(globalState, x.uuid)) {
          return (
            <div className="simpleListRow">
              <Link to={`/${type}/${x.uuid}`}>
                <Avatar small={true} actor={x} />
                <span className="value">
                  {getDisplayName(x.uuid, globalState)}
                </span>
              </Link>
              {xAction && (
                <CloseIcon
                  className="simpleListXAction"
                  onClick={() => xAction(x.uuid)}
                />
              )}
            </div>
          );
        }
      })}
    </div>
  );
};

export default SimpleList;
