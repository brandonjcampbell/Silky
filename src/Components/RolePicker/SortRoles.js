import React, { useContext, useState } from "react";
import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile } from "../../utils/";
import { classifyRoles } from "../../llm/roles";
import { isConfigured } from "../../llm/config";
import { roleIsExplicit, roleOf } from "../../role";
import SpinnerIcon from "../SpinnerIcon";
import "./RolePicker.css";

/** One button: Spinner sorts every element that was never designated into character / location / thing. */
const SortRoles = ({ onDone }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const pending = loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter((a) => a && a.type === "element" && !roleIsExplicit(a));
  if (!pending.length) return null;
  const run = async () => {
    setBusy(true); setMsg("");
    try {
      let roles = {};
      if (isConfigured()) roles = await classifyRoles(pending);
      let n = 0;
      pending.forEach((e) => { const r = roles[e.file] || roleOf(e); if (r) { e.role = r; saveFile(dir + e.file, e); n += 1; } });
      setMsg(`Sorted ${n} element${n === 1 ? "" : "s"}${isConfigured() ? "" : " by name and description (connect Spinner for a better pass)"}.`);
      onDone && onDone();
    } catch (e) { setMsg(e.message || String(e)); } finally { setBusy(false); }
  };
  return (
    <span className="sortRoles">
      <button type="button" disabled={busy} onClick={run} title={`${pending.length} element${pending.length === 1 ? " has" : "s have"} no role yet. ${isConfigured() ? "Spinner" : "A name-and-description guess"} sorts them into characters, locations and things; you can change any one on its page.`}>
        <SpinnerIcon /> {busy ? "Sorting…" : `Sort ${pending.length} unassigned`}
      </button>
      {msg && <small> {msg}</small>}
    </span>
  );
};

export default SortRoles;
