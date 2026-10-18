import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaProjectDiagram } from "react-icons/fa";
import { analyseWeb } from "../../analysis/graph";
import "./WebAnalysis.css";

export const GROUP_COLORS = ["#e0245e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#84cc16", "#06b6d4"];
const pct = (v) => `${Math.round(v * 100)}`;

/** The shape of a web: centrality, importance, communities, bridges, orphans. */
const WebAnalysis = ({ elements, lookup, colorBy, onColorBy }) => {
  const [open, setOpen] = useState(true);
  const r = useMemo(() => analyseWeb(elements), [elements]);
  const name = (id) => { const a = lookup(id); return a ? `${a.icon || ""} ${a.name}`.trim() : id; };
  const top = (map, k = 6) => [...map.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, k);
  const Row = ({ id, value, bar }) => (
    <li><Link to={"/elements/" + id}>{name(id)}</Link>{bar != null && <i className="webA__bar"><b style={{ width: `${Math.round(bar * 100)}%` }} /></i>}<span>{value}</span></li>
  );
  const n = r.nodes.length;
  if (!n) return null;
  return (
    <section className={"webA" + (open ? " is-open" : "")}>
      <button type="button" className="webA__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}><FaProjectDiagram /> Structure <small>{n} nodes · {r.edges} links · {r.components.length} component{r.components.length === 1 ? "" : "s"}{r.orphans.length ? ` · ${r.orphans.length} orphan${r.orphans.length === 1 ? "" : "s"}` : ""}</small></button>
      {open && (
        <div className="webA__body">
          <div className="webA__stats">
            <span><b>{(r.density * 100).toFixed(0)}%</b> density</span>
            <span><b>{r.avgDegree.toFixed(1)}</b> links per node</span>
            <span><b>{r.diameter}</b> steps across</span>
            <span><b>{r.communities.length}</b> communit{r.communities.length === 1 ? "y" : "ies"}</span>
            <span><b>{r.cuts.size}</b> cut point{r.cuts.size === 1 ? "" : "s"}</span>
          </div>

          <div className="webA__cols">
            <div>
              <h6>Most connected <small>degree</small></h6>
              <ul className="webA__list">{top(r.degree).map(([id, v]) => <Row key={id} id={id} value={v} bar={v / (top(r.degree)[0] ? top(r.degree)[0][1] : 1)} />)}</ul>
            </div>
            <div>
              <h6>Bridges <small>betweenness — paths run through them</small></h6>
              <ul className="webA__list">{top(r.betweenness).map(([id, v]) => <Row key={id} id={id} value={pct(v)} bar={v / (top(r.betweenness)[0] ? top(r.betweenness)[0][1] : 1)} />)}{!top(r.betweenness).length && <li className="muted">Nothing lies between anything else.</li>}</ul>
            </div>
            <div>
              <h6>Importance <small>PageRank</small></h6>
              <ul className="webA__list">{top(r.pagerank).map(([id, v]) => <Row key={id} id={id} value={pct(v)} bar={v} />)}</ul>
            </div>
            <div>
              <h6>Closest to everything <small>closeness</small></h6>
              <ul className="webA__list">{top(r.closeness).map(([id, v]) => <Row key={id} id={id} value={pct(v)} bar={v / (top(r.closeness)[0] ? top(r.closeness)[0][1] : 1)} />)}</ul>
            </div>
          </div>

          <h6>Communities <small>who clusters with whom</small>
            <label className="webA__color"><input type="checkbox" checked={!!colorBy} onChange={(e) => onColorBy && onColorBy(e.target.checked ? r.communities : null)} /> colour the graph</label>
          </h6>
          <div className="webA__groups">
            {r.communities.map((g, i) => (
              <div key={i} className="webA__group" style={{ borderColor: GROUP_COLORS[i % GROUP_COLORS.length] }}>
                <b style={{ color: GROUP_COLORS[i % GROUP_COLORS.length] }}>Group {i + 1} · {g.length}</b>
                <p>{g.slice(0, 14).map((id) => <Link key={id} to={"/elements/" + id}>{name(id)}</Link>).reduce((a, b) => [a, ", ", b])}{g.length > 14 ? `, +${g.length - 14}` : ""}</p>
              </div>
            ))}
            {!r.communities.length && <p className="muted">No links yet, so no groups.</p>}
          </div>

          {r.cuts.size > 0 && (
            <>
              <h6>Cut points <small>remove one and the web falls into pieces</small></h6>
              <p className="webA__chips">{[...r.cuts].map((id) => <Link key={id} to={"/elements/" + id}>{name(id)}</Link>)}</p>
            </>
          )}
          {(r.orphans.length > 0 || r.leaves.length > 0) && (
            <>
              <h6>Edges of the web</h6>
              {r.orphans.length > 0 && <p className="webA__chips"><span className="webA__label">Orphans — in the web, linked to nothing:</span>{r.orphans.map((id) => <Link key={id} to={"/elements/" + id}>{name(id)}</Link>)}</p>}
              {r.leaves.length > 0 && <p className="webA__chips"><span className="webA__label">Hanging by one link:</span>{r.leaves.slice(0, 20).map((id) => <Link key={id} to={"/elements/" + id}>{name(id)}</Link>)}{r.leaves.length > 20 && <span className="muted">+{r.leaves.length - 20}</span>}</p>}
            </>
          )}
          {r.components.length > 1 && <p className="muted">The web is in {r.components.length} separate pieces: {r.components.map((c) => c.length).join(", ")} nodes each.</p>}
        </div>
      )}
    </section>
  );
};

export default WebAnalysis;
