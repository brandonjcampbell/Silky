import React, { useContext, useState } from "react";
import _ from "lodash";
import { store } from "../../MyContext";
import "./TitleBar.css";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "../Avatar";
import Swatch from "../Swatch";
import { confirmAlert } from "react-confirm-alert"; // Import

const TitleBar = ({ actor }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");

  const keyPress = (e) => {
    if (e.keyCode === 13) {
      saveTitle();
    }
    if (e.keyCode === 27) {
      setEditTitle(false);
    }
  };

  const saveTitle = () => {
    setEditTitle(false);
    let clone = _.cloneDeep(actor);
    clone.name = title;
    dispatch({
      action: "saveActor",
      for: actor.type,
      payload: { actor: clone },
    });
  };

  const remove = () => {
    confirmAlert({
      title: "Confirm to remove",
      message:
        "Are you sure you want to remove " +
        actor.type +
        " " +
        actor.name +
        "? You won't be able to undo this action.",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            dispatch({
              action: "removeActor",
              payload: { uuid: actor.uuid },
            });
          },
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };


  return (
    <h2 className="workspaceHeader">
      <Avatar actor={actor} clickable={true} />

      <span className= "title">
        <span
          onClick={() => {
            setEditTitle(!editTitle);
            setTitle(actor.name);
          }}
        >
          {!editTitle && actor.name}
        </span>
        {editTitle && (
          <TextField
            autoFocus
            sx={{ bgcolor: "white" }}
            id="outlined-basic"
            value={title}
            onKeyDown={keyPress}
            onBlur={() => {
              saveTitle();
            }}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}
      </span>
      <DeleteIcon className="delete" onClick={remove} />
    </h2>
  );
};
export default TitleBar;
