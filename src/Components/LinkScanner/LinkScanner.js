import SpinnerIcon from "../SpinnerIcon";
import React, { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile } from "../../utils/";
import { roleFromKind } from "../../role";
import { scanSnippet } from "../../analysis/links";
import { scanWithModel } from "../../llm/scan";
import { isConfigured } from "../../llm/config";
import "./LinkScanner.css";

const KIND_ICON = { person: "🙂", place: "📍", thing: "🔹", group: "🏛️", idea: "💡" };
const pct = (x) => Math.round(x * 100) + "%";

/**
 * Scan a scene's text for links it should have — facts it reveals, threads
 * and webs it belongs in, names that aren't elements yet — and apply them.
 */
const LinkScanner = ({ element, onChange }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [result, setResult] = useState(null);
  const [model, setModel] = useState(null); // Spinner's refinement
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(new Set());
  const abortRef = useRef(null);
  const configured = isConfigured();

  const actors = () => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
  const save = (a) => saveFile(dir + a.file, a);
  const fresh = () => loadFile(dir + element.file) || element;
  const mark = (k) => setDone((d) => new Set([...d, k]));

  const run = () => {
    setErr(null);
    setModel(null);
    setDone(new Set());
    setResult(scanSnippet(fresh(), actors()));
  };

  const refine = async () => {
    if (!result) return;
    setErr(null);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const out = await scanWithModel({
        scene: { name: element.name, text: result.text.slice(0, 24000) },
        cast: result.mentioned.map((m) => m.element.name),
        candidates: result.facts.map((c) => c.fact.name),
        signal: ctrl.signal,
      });
      setModel(out);
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  /* ── applying ── */
  const linkFact = (fact) => {
    const s = fresh();
    const f = loadFile(dir + fact.file) || fact;
    if (!s.reveals.includes(f.file)) s.reveals.push(f.file);
    f.revealed_by = f.revealed_by || [];
    if (!f.revealed_by.includes(s.file)) f.revealed_by.push(s.file);
    save(s); save(f); mark("fact:" + f.file); onChange();
  };
  const linkThread = (thread) => {
    const s = fresh();
    const t = loadFile(dir + thread.file) || thread;
    if (!t.sequences.includes(s.file)) {
      // insert after the nearest preceding scene in list order
      const all = actors().filter((a) => a.type === "snippet").sort((a, b) => a.order - b.order).map((a) => a.file);
      const myPos = all.indexOf(s.file);
      let at = t.sequences.length;
      for (let i = 0; i < t.sequences.length; i += 1) if (all.indexOf(t.sequences[i]) > myPos) { at = i; break; }
      t.sequences.splice(at, 0, s.file);
    }
    s.sequenced_in = s.sequenced_in || [];
    if (!s.sequenced_in.includes(t.file)) s.sequenced_in.push(t.file);
    save(s); save(t); mark("thread:" + t.file); onChange();
  };
  const linkWeb = (web) => {
    const s = fresh();
    const w = loadFile(dir + web.file) || web;
    if (!(w.captures || []).some((c) => c.file === s.file)) {
      const xs = (w.captures || []).map((c) => c.x), ys = (w.captures || []).map((c) => c.y);
      const cx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 600, cy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 400;
      w.captures.push({ file: s.file, x: Math.round(cx + 40), y: Math.round(cy + 40) });
    }
    s.captured_in = s.captured_in || [];
    if (!s.captured_in.includes(w.file)) s.captured_in.push(w.file);
    save(s); save(w); mark("web:" + w.file); onChange();
  };
  const createElement = ({ name, icon, description, kind }) => {
    const uuid = "element-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const a = { name, file: uuid + ".element.json", type: "element", icon: icon || "🔹", order: Date.now(), uuid, content: description ? `<p>${description}</p>` : " ", involved_in: [], captured_in: [], origin: "spinner-scan", kind: kind || "thing", role: roleFromKind(kind) };
    save(a); return a;
  };
  const createFact = ({ statement, involves }) => {
    const all = actors();
    const s = fresh();
    const uuid = "fact-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const f = { name: statement, file: uuid + ".element.json", type: "fact", icon: "💡", order: Date.now(), uuid, content: [], causes: [], because: [], involves: [], revealed_by: [s.file], captured_in: [], origin: "spinner-scan" };
    involves.forEach((n) => {
      const e = all.find((a) => a.type === "element" && a.name.toLowerCase() === String(n).toLowerCase());
      if (e) { f.involves.push(e.file); e.involved_in = e.involved_in || []; e.involved_in.push(f.file); save(e); }
    });
    s.reveals.push(f.file);
    save(f); save(s); mark("new:" + statement); onChange();
  };
  const addName = (name, extra = {}) => {
    const a = createElement({ name, icon: extra.icon || KIND_ICON[extra.kind] || "🔹", description: extra.description, kind: extra.kind });
    mark("name:" + name); onChange();
    return a;
  };

  const factsToShow = (() => {
    if (!result) return [];
    if (model) {
      const est = new Set(model.established);
      return result.facts.map((c, i) => ({ ...c, confirmed: est.has(i) })).sort((a, b) => Number(b.confirmed) - Number(a.confirmed) || b.score - a.score);
    }
    return result.facts.slice(0, 25);
  })();
  const total = result ? factsToShow.length + result.threads.length + result.webs.length + result.names.length + (model ? model.newFacts.length + model.newElements.length : 0) : 0;

  return (
    <section className="linkScan">
      <div className="linkScan__bar">
        <button type="button" className="linkScan__run" onClick={run}><FaSearch /> {result ? "Scan again" : "Scan for links"}</button>
        {result && configured && !busy && !model && <button type="button" onClick={refine} title="Spinner reads the scene and confirms which facts it really establishes, and what it establishes that the project doesn’t know yet"><SpinnerIcon /> Ask Spinner</button>}
        {busy && <><span className="linkScan__busy">Spinner is reading…</span><button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button></>}
        {result && !busy && <span className="linkScan__summary">{result.mentioned.length} elements mentioned · {total} suggestion{total === 1 ? "" : "s"}</span>}
        {err && <span className="linkScan__err">{err}</span>}
      </div>

      {result && (
        <div className="linkScan__body">
          {result.mentioned.length > 0 && (
            <p className="linkScan__mentions">
              <span className="muted">Mentioned:</span>{" "}
              {result.mentioned.slice(0, 20).map((m) => <Link key={m.element.file} to={"/elements/" + m.element.file} className="pill">{m.element.icon} {m.element.name} <b>{m.n}</b></Link>)}
            </p>
          )}

          {factsToShow.length > 0 && (
            <>
              <h4>Facts this scene may reveal {model && <small>— Spinner confirmed {model.established.length}</small>}
                {factsToShow.filter((c) => !done.has("fact:" + c.fact.file) && (!model || c.confirmed)).length > 1 && (
                  <button type="button" className="linkScan__all" onClick={() => factsToShow.filter((c) => !done.has("fact:" + c.fact.file) && (!model || c.confirmed)).forEach((c) => linkFact(c.fact))}>
                    Add {model ? "confirmed" : "all"}
                  </button>
                )}
              </h4>
              <ul className="linkScan__list">
                {factsToShow.map((c) => {
                  const k = "fact:" + c.fact.file;
                  return (
                    <li key={c.fact.file} className={(model && !c.confirmed ? "is-dim" : "") + (done.has(k) ? " is-done" : "")}>
                      <button type="button" disabled={done.has(k)} onClick={() => linkFact(c.fact)}>{done.has(k) ? "Added" : "Add"}</button>
                      <span className="linkScan__text"><Link to={"/elements/" + c.fact.file}>{c.fact.name}</Link></span>
                      <span className="linkScan__meta">{model ? (c.confirmed ? "confirmed" : "not here") : `${pct(c.score)}`}{c.elsewhere === 0 ? " · unplaced" : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {model && model.newFacts.length > 0 && (
            <>
              <h4>New facts Spinner found here</h4>
              <ul className="linkScan__list">
                {model.newFacts.map((f) => {
                  const k = "new:" + f.statement;
                  return (
                    <li key={k} className={done.has(k) ? "is-done" : ""}>
                      <button type="button" disabled={done.has(k)} onClick={() => createFact(f)}>{done.has(k) ? "Created" : "Create"}</button>
                      <span className="linkScan__text">{f.statement}</span>
                      <span className="linkScan__meta">{f.involves.join(", ")}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {(result.names.length > 0 || (model && model.newElements.length > 0)) && (
            <>
              <h4>Names that aren’t elements yet</h4>
              <ul className="linkScan__list">
                {(model ? model.newElements.map((e) => ({ key: e.name, label: `${e.icon || KIND_ICON[e.kind] || "🔹"} ${e.name}`, meta: e.description, extra: e })) : result.names.map((n) => ({ key: n.name, label: n.name, meta: `${n.n}×`, extra: {} }))).map((x) => {
                  const k = "name:" + x.key;
                  return (
                    <li key={k} className={done.has(k) ? "is-done" : ""}>
                      <button type="button" disabled={done.has(k)} onClick={() => addName(x.key, x.extra)}>{done.has(k) ? "Created" : "Create element"}</button>
                      <span className="linkScan__text">{x.label}</span>
                      <span className="linkScan__meta">{x.meta}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {result.threads.length > 0 && (
            <>
              <h4>Threads this scene may belong in</h4>
              <ul className="linkScan__list">
                {result.threads.map((c) => {
                  const k = "thread:" + c.thread.file;
                  return (
                    <li key={k} className={done.has(k) ? "is-done" : ""}>
                      <button type="button" disabled={done.has(k)} onClick={() => linkThread(c.thread)}>{done.has(k) ? "Added" : "Add"}</button>
                      <span className="linkScan__text"><Link to={"/elements/" + c.thread.file}>{c.thread.icon} {c.thread.name}</Link></span>
                      <span className="linkScan__meta">shares {c.shared.map((e) => e.name).slice(0, 4).join(", ")}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {result.webs.length > 0 && (
            <>
              <h4>Webs that should capture it</h4>
              <ul className="linkScan__list">
                {result.webs.map((c) => {
                  const k = "web:" + c.web.file;
                  return (
                    <li key={k} className={done.has(k) ? "is-done" : ""}>
                      <button type="button" disabled={done.has(k)} onClick={() => linkWeb(c.web)}>{done.has(k) ? "Added" : "Add"}</button>
                      <span className="linkScan__text"><Link to={"/elements/" + c.web.file}>{c.web.icon} {c.web.name}</Link></span>
                      <span className="linkScan__meta">{c.shared} of its cast are here</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {total === 0 && <p className="muted">Nothing to suggest — every mentioned element’s facts are already linked here, or the scene names no known elements.</p>}
        </div>
      )}
    </section>
  );
};

export default LinkScanner;
