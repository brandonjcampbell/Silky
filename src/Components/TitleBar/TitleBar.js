import React, { useContext } from "react";
import _ from "lodash";
import { store } from "../../MyContext";
import "./TitleBar.css";
import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "../Avatar";
import remove from "../../utils/remove";

const TitleBar = ({ actor }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const checkKey = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.currentTarget.blur()
    }
  };

  const saveTitle = (e) => {
    let clone = _.cloneDeep(actor);
    clone.name = e.currentTarget.innerHTML;
    dispatch({
      action: "saveActor",
      for: actor.type,
      payload: { actor: clone },
    });
  };

  return (
    <h3 className="workspaceHeader">
      <Avatar actor={actor} clickable={true} />
      <p contenteditable="true" onBlur={saveTitle} onKeyDown={checkKey}>
        {actor.name}
      </p>

      <DeleteIcon
        className="delete"
        onClick={() => {
          remove(actor, dispatch);
        }}
      />
    </h3>
  );
};
export default TitleBar;
