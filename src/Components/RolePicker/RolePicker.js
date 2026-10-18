import React from "react";
import { ROLES, roleOf, roleIsExplicit } from "../../role";
import "./RolePicker.css";

/** Character / Location / Thing, on an element's page. */
const RolePicker = ({ element, onChange }) => {
  const cur = roleOf(element);
  const explicit = roleIsExplicit(element);
  return (
    <div className="rolePicker" role="radiogroup" aria-label="Role">
      {ROLES.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={cur === r.id} className={"rolePicker__opt" + (cur === r.id ? " is-on" : "")} title={r.blurb} onClick={() => onChange(r.id)}>
          <span>{r.glyph}</span> {r.name}
        </button>
      ))}
      <span className="rolePicker__note">{explicit ? (cur === "character" ? "Can be talked to in Spinner's chats." : cur === "location" ? "Can be pinned on a map." : "Present in chats, never speaks.") : "Guessed — click to confirm."}</span>
    </div>
  );
};

export default RolePicker;
