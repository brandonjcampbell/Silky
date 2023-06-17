import React from "react";
import _ from "lodash";
import "./TitleBar.css";
import DeleteIcon from "@material-ui/icons/Delete";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";

const TitleBar = ({ element, save, remove }) => {
  const checkKey = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const saveTitle = (e) => {
    element.name = e.currentTarget.innerHTML;
    save(element);
  };

  function determineIcon(element) {
    if (element.type === "element") {
      return <HiPuzzle />;
    }
    if (element.type === "fact") {
      return <GiLightBulb />;
    }
    if (element.type === "snippet") {
      return <TiScissors />;
    }
    if (element.type === "thread") {
      return <GiSewingString />;
    }

    if (element.type === "web") {
      return <GiSpiderWeb />;
    }
  }

  return (
    <h3 className="workspaceHeader">
      <div className="typeIcon"> {determineIcon(element)} </div>

      <div className="icon">{element.icon}</div>
      <p contenteditable="true" onBlur={saveTitle} onKeyDown={checkKey}>
        {element.name}
      </p>

      <DeleteIcon
        className="delete"
        onClick={() => {
          remove(element.file);
        }}
      />
    </h3>
  );
};
export default TitleBar;
