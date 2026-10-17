import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaProjectDiagram } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile } from "../../utils/";
import { impactOf } from "../../impact";
import { versionsOf } from "../../history";
import "./Impact.css";

const Row = ({ item }) => (
  <li>
    <Link to={"/elements/" + item.actor.file}>{item.actor.icon} {item.actor.name}</Link>
    <span className="impact__how">{item.how}</span>
  </li>
);

/** What depends on this actor; what may be stale; propagate a rename into the prose. */
const Impact = ({ element, onChange }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, element.file, element.updated, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = useMemo(() => impactOf(element, actors, dir), [element, actors, dir]);

  // a rename we can offer to carry into the scenes
  const versions = versionsOf(dir, element.file);
  const prevName = versions.find((v) => v.name !== element.name);
  const oldName = prevName && prevName.name;
  const oldMentions = useMemo(() => {
    if (element.type !== "element" || !oldName || oldName === element.name) return [];
    const re = new RegExp("(^|[^A-Za-z\\u00C0-\\u024F])" + oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z\\u00C0-\\u024F])", "g");
    return actors.filter((a) => a.type === "snippet").map((s) => ({ scene: s, n: (String(s.content).replace(/<[^>]+>/g, " ").match(re) || []).length })).filter((x) => x.n > 0);
  }, [actors, oldName, element]);

  const propagate = () => {
    const re = new RegExp("(^|[^A-Za-z\\u00C0-\\u024F>])" + oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z\\u00C0-\\u024F])", "g");
    let n = 0;
    oldMentions.forEach(({ scene }) => {
      const s = loadFile(dir + scene.file);
      if (!s) return;
      const before = s.content;
      s.content = String(s.content).replace(re, (m, pre) => { n += 1; return pre + element.name; });
      if (s.content !== before) saveFile(dir + s.file, s);
    });
    // facts phrased with the old name too
    actors.filter((a) => a.type === "fact" && (a.involves || []).includes(element.file) && re.test(a.name)).forEach((f) => {
      const ff = loadFile(dir + f.file);
      if (ff) { ff.name = ff.name.replace(re, (m, pre) => pre + element.name); saveFile(dir + ff.file, ff); }
    });
    setTick((t) => t + 1);
    onChange && onChange();
    window.alert(`Replaced ${n} mention${n === 1 ? "" : "s"} of “${oldName}” with “${element.name}”.`);
  };

  if (!r.total && !r.stale.length && !r.derived.length && !oldMentions.length) return null;

  const stamp = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <section className={"impact" + (open ? " is-open" : "")}>
      <button type="button" className="impact__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <FaProjectDiagram /> <span>Impact</span>
        <span className="impact__summary">
          {r.scenes.length ? `${r.scenes.length} scene${r.scenes.length === 1 ? "" : "s"}` : ""}{r.facts.length ? ` · ${r.facts.length} fact${r.facts.length === 1 ? "" : "s"}` : ""}{r.threads.length ? ` · ${r.threads.length} thread${r.threads.length === 1 ? "" : "s"}` : ""}{r.webs.length ? ` · ${r.webs.length} web${r.webs.length === 1 ? "" : "s"}` : ""}
          {(r.stale.length || r.derived.length) ? <b className="impact__flag"> · {r.stale.length + r.derived.length} to re-check</b> : null}
          {oldMentions.length ? <b className="impact__flag"> · renamed</b> : null}
        </span>
        <span className="impact__chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="impact__body">
          {oldMentions.length > 0 && (
            <div className="impact__rename">
              <p>This was “<b>{oldName}</b>” and is now “<b>{element.name}</b>”. The old name still appears in {oldMentions.reduce((n, x) => n + x.n, 0)} place{oldMentions.reduce((n, x) => n + x.n, 0) === 1 ? "" : "s"} across {oldMentions.length} scene{oldMentions.length === 1 ? "" : "s"}, and in facts phrased with it.</p>
              <button type="button" className="primary" onClick={propagate}>Rename in scenes and facts</button>
            </div>
          )}
          {(r.stale.length > 0 || r.derived.length > 0) && (
            <>
              <h4>Re-check</h4>
              <ul className="impact__list impact__list--stale">
                {r.stale.map((x) => <li key={x.actor.file}><Link to={"/elements/" + x.actor.file}>{x.actor.icon} {x.actor.name}</Link><span className="impact__how">{x.why}</span></li>)}
                {r.derived.map((d, i) => <li key={i}><span>{d.what}{d.who ? ` (${d.who})` : ""} from {stamp(d.at)}</span><span className="impact__how">{d.why || "written before the last edit — re-run to refresh"}</span></li>)}
              </ul>
            </>
          )}
          {r.scenes.length > 0 && <><h4>Scenes</h4><ul className="impact__list">{r.scenes.slice(0, 40).map((x) => <Row key={x.actor.file} item={x} />)}{r.scenes.length > 40 && <li className="muted">…and {r.scenes.length - 40} more</li>}</ul></>}
          {r.facts.length > 0 && <><h4>Facts</h4><ul className="impact__list">{r.facts.slice(0, 40).map((x) => <Row key={x.actor.file} item={x} />)}{r.facts.length > 40 && <li className="muted">…and {r.facts.length - 40} more</li>}</ul></>}
          {r.elements.length > 0 && <><h4>Elements</h4><ul className="impact__list impact__list--inline">{r.elements.slice(0, 30).map((x) => <Row key={x.actor.file} item={x} />)}</ul></>}
          {r.threads.length > 0 && <><h4>Threads</h4><ul className="impact__list">{r.threads.map((x) => <Row key={x.actor.file} item={x} />)}</ul></>}
          {r.webs.length > 0 && <><h4>Webs</h4><ul className="impact__list">{r.webs.map((w) => <li key={w.file}><Link to={"/elements/" + w.file}>{w.icon} {w.name}</Link></li>)}</ul></>}
        </div>
      )}
    </section>
  );
};

export default Impact;
