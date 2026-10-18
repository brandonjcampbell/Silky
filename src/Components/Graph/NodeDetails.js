import React from "react";
import { useNavigate } from "react-router-dom";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { kindOf } from "../../kinds";
import { ROLES, roleOf } from "../../role";

const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const words = (h) => (plain(h).match(/\S+/g) || []).length;

/** What a node is, in a panel beside the graph; Open takes it to its own tab. */
const NodeDetails = ({ actor, neighbours = [], onPick, onClose }) => {
  const navigate = useNavigate();
  if (!actor) return null;
  const kind = kindOf(actor.type);
  const role = actor.type === "element" ? ROLES.find((r) => r.id === roleOf(actor)) : null;
  const desc = typeof actor.content === "string" ? plain(actor.content) : "";
  const counts = [];
  if (actor.type === "element") counts.push(`${(actor.involved_in || []).length} facts`);
  if (actor.type === "fact") { counts.push(`${(actor.involves || []).length} involved`, `${(actor.revealed_by || []).length} scenes reveal it`); if ((actor.causes || []).length) counts.push(`causes ${actor.causes.length}`); if ((actor.because || []).length) counts.push(`because of ${actor.because.length}`); }
  if (actor.type === "snippet") counts.push(`${words(actor.content).toLocaleString()} words`, `${(actor.reveals || []).length} facts revealed`);
  if (actor.type === "thread") counts.push(`${(actor.sequences || []).length} scenes`);
  if (actor.type === "web") counts.push(`${(actor.captures || []).length} captured`);
  const open = () => navigate("/elements/" + actor.file);
  return (
    <div className="nodeDetails">
      <div className="nodeDetails__head">
        <span className="nodeDetails__icon">{actor.icon}</span>
        <div className="nodeDetails__title">
          <button type="button" className="nodeDetails__name" onClick={open} title="Open in its own tab">{actor.name}</button>
          <span className="nodeDetails__kind">{kind ? kind.one : actor.type}{role ? ` · ${role.glyph} ${role.name.toLowerCase()}` : ""}</span>
        </div>
        <button type="button" className="nodeDetails__close" aria-label="Close" onClick={onClose}><FaTimes /></button>
      </div>
      {desc && <p className="nodeDetails__desc">{desc.length > 320 ? desc.slice(0, 320).replace(/\s+\S*$/, "") + "…" : desc}</p>}
      {counts.length > 0 && <p className="nodeDetails__counts">{counts.join(" · ")}</p>}
      {neighbours.length > 0 && (
        <>
          <h6>Linked here</h6>
          <ul className="nodeDetails__links">
            {neighbours.slice(0, 24).map((n) => (
              <li key={n.actor.file}><button type="button" onClick={() => onPick(n.actor.file)}>{n.actor.icon} {n.actor.name}</button><small>{n.label}</small></li>
            ))}
            {neighbours.length > 24 && <li className="muted">…and {neighbours.length - 24} more</li>}
          </ul>
        </>
      )}
      <button type="button" className="nodeDetails__open" onClick={open}><FaExternalLinkAlt /> Open</button>
      <p className="nodeDetails__hint">Double-click a node to open it straight away.</p>
    </div>
  );
};

export default NodeDetails;
