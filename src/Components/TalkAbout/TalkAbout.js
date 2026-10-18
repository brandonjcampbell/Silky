import SpinnerIcon from "../SpinnerIcon";
import { isCharacter } from "../../role";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FaUserFriends } from "react-icons/fa";
import "./TalkAbout.css";

/**
 * Header buttons: talk to Spinner about this actor; for an element, also
 * talk *to* it. They land in the header's tool slot next to Read aloud.
 */
const TalkAbout = ({ element }) => {
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    const find = () => setSlot(document.querySelector(".workspace .workspaceHeader [data-tools-slot]"));
    find();
    const t = setTimeout(find, 50);
    return () => clearTimeout(t);
  }, [element.file]);

  const buttons = (
    <>
      {element.type === "element" && isCharacter(element) && (
        <button type="button" className="talkAbout__btn" title={`Talk to ${element.name}`} onClick={() => navigate("/spinner?with=" + encodeURIComponent(element.file))}>
          <FaUserFriends />
        </button>
      )}
      <button type="button" className="talkAbout__btn" title="Talk to Spinner about this" onClick={() => navigate("/spinner?about=" + encodeURIComponent(element.file))}>
        <SpinnerIcon />
      </button>
    </>
  );
  return slot ? createPortal(buttons, slot) : null;
};

export default TalkAbout;
