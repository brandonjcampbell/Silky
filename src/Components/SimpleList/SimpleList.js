import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import { store } from "../../MyContext";
import CloseIcon from "@material-ui/icons/Close";
import {getDisplayName} from "../../utils";
import "./SimpleList.css";

const homedir = window.require("os").homedir();

const SimpleList = ({ list,xAction }) => {
  const globalState = useContext(store);

  return (
    <div>
      {list.map((x) => (
        <div className="simpleListRow">
          <Link to={`/threads/${x.uuid}`}>
            <Avatar
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
            />
            {getDisplayName(x.uuid,globalState)}
          </Link>
          {xAction && <CloseIcon className="simpleListXAction" onClick={() => xAction(x.uuid)} />}
        </div>
      ))}
    </div>
  );
};

export default SimpleList;
