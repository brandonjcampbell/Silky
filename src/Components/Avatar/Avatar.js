import React, { useContext, useState, useEffect } from "react";
import _ from "lodash";
import MUIAvatar from "@mui/material/Avatar";
import { store } from "../../MyContext";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle, HiTag } from "react-icons/hi";
import { uploadPic } from "../../utils";
import { SketchPicker } from "react-color";

import "./Avatar.css";
const homedir = window.require("os").homedir();

const Avatar = ({ actor, clickable = false, small = false }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [freshener, setFreshener] = useState("");

  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState({ hex: actor.color });

  const handleClick = () => {
    if (clickable) {
      setDisplayColorPicker(!displayColorPicker);
    }
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (test) => {
    setColor(test);
    updateColor(test);
  };

  function updateColor(test) {
    let cloned = _.cloneDeep(actor);
    cloned.color = test.hex;
    dispatch({
      action: "saveActor",
      for: actor.type,
      payload: { actor: cloned },
    });
  }

  const popover = {
    position: "absolute",
    zIndex: "200",
  };
  const cover = {
    position: "fixed",
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  };

  return (
    <div
      className={small ? "avatarWrapper small" : "avatarWrapper"}
      onClick={handleClick}
    >
      {actor.type === "element" && (
        <HiPuzzle className="avatar" style={{ color: actor.color }} />
      )}
      {(actor.type === "fact" || actor.type === "link") && (
        <GiLightBulb className="avatar" style={{ color: actor.color }} />
      )}
      {actor.type === "snippet" && (
        <TiScissors className="avatar" style={{ color: actor.color }} />
      )}
      {actor.type === "thread" && (
        <GiSewingString className="avatar" style={{ color: actor.color }} />
      )}
      {actor.type === "web" && (
        <GiSpiderWeb className="avatar" style={{ color: actor.color }} />
      )}
      {actor.type === "tag" && (
        <HiTag className="avatar" style={{ color: actor.color }} />
      )}

      {/* <MUIAvatar
        alt=" "
        className="avatarImage"
        onClick={() => {
          if (clickable) {
            uploadPic(actor.uuid, globalState, setFreshener);
          }
        }}
        src={
          homedir +
          "\\.silky\\" +
          globalState.state.project +
          "\\" +
          actor.uuid +
          ".png"
        }
      /> */}


        {displayColorPicker ? (
          <div style={popover}>
            <div style={cover} onClick={handleClose} />
            <SketchPicker color={actor.color} onChange={handleChange} />
          </div>
        ) : null}
     
    </div>
  );
};

export default Avatar;
