import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaFileImport, FaBookOpen } from "react-icons/fa";
import { KINDS } from "../../kinds";
import ImportManuscript from "../ImportManuscript";
import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile, makeDir, renameDir } from "../../utils/";
import { flushNow } from "../../storage";
import TextEditor from "../TextEditor";
import EditorToolbar from "../TextEditor/EditorToolbar";
import FlowToasts from "../Flow";
import SpinnerIcon from "../SpinnerIcon";
import { LEVELS, getLevel, setLevel, suggestedBook, clearSuggestedBook } from "../../flow/watcher";
import { isConfigured } from "../../llm/config";
import { isPlaceholderScene, isPlaceholderProject } from "../../llm/naming";
import logo from "../../images/logo.svg";
import "./FlowPage.css";

export const stamp = () => {
  const d = new Date();
  return `Writing — ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
};
const words = (html) => (String(html || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;

/**
 * Just write. No project to make, no scene to name: the page holds a
 * manuscript as a run of scenes, and Spinner builds the bible behind it —
 * names the scenes, notices the people and facts, suggests a title.
 * Ctrl/Cmd+Enter (or a line of ***) ends a scene and begins the next.
 */
const FlowPage = ({ embedded = false, setRefresh }) => {
  const { state, dispatch } = useContext(store);
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [importing, setImporting] = useState(false);
  const [side, setSide] = useState(() => { try { return localStorage.getItem("silky:flow-side") !== "0"; } catch (e) { return true; } });
  const [book, setBook] = useState(suggestedBook);
  const [level, setLvl] = useState(getLevel());
  const docRef = useRef(null);
  const focusFile = useRef(null);

  // a project appears on first use; Flow defaults to Autopilot
  useEffect(() => {
    if (!state.project) {
      const name = stamp();
      makeDir(name);
      dispatch({ action: "setProject", payload: { name } });
    }
    if (getLevel() === "off" && isConfigured()) { setLevel("auto"); setLvl("auto"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onLevel = (e) => setLvl(e.detail);
    const onBook = (e) => setBook(e.detail);
    const onChanged = () => setTick((t) => t + 1);
    window.addEventListener("silky-flow-level", onLevel);
    window.addEventListener("silky-flow-book", onBook);
    window.addEventListener("silky-flow-changed", onChanged);
    return () => { window.removeEventListener("silky-flow-level", onLevel); window.removeEventListener("silky-flow-book", onBook); window.removeEventListener("silky-flow-changed", onChanged); };
  }, []);

  const dir = state.dir;
  const actors = useMemo(() => (dir ? loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean) : []), [dir, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = new Map(actors.map((a) => [a.file, a]));

  // the manuscript thread, made on demand
  const manuscript = useMemo(() => {
    if (!dir) return null;
    let t = actors.find((a) => a.type === "thread" && a.name === "Manuscript") || actors.filter((a) => a.type === "thread").sort((a, b) => b.sequences.length - a.sequences.length)[0];
    if (!t) {
      const uuid = "thread-" + Date.now().toString(36);
      t = { name: "Manuscript", file: uuid + ".element.json", type: "thread", icon: "📖", order: 0, uuid, content: "", sequences: [], captured_in: [] };
      saveFile(dir + t.file, t);
    }
    return t;
  }, [dir, actors]); // eslint-disable-line react-hooks/exhaustive-deps

  let scenes = manuscript ? manuscript.sequences.map((f) => byFile.get(f)).filter((a) => a && a.type === "snippet") : [];
  // scenes that exist but aren't in the thread (made elsewhere) come last, in list order
  const loose = actors.filter((a) => a.type === "snippet" && !manuscript.sequences.includes(a.file)).sort((a, b) => a.order - b.order);
  if (loose.length) { manuscript.sequences.push(...loose.map((a) => a.file)); saveFile(dir + manuscript.file, manuscript); scenes = [...scenes, ...loose]; }

  const bump = () => { setTick((t) => t + 1); setRefresh && setRefresh(Date.now()); };
  const newScene = () => {
    const uuid = "scene-" + Date.now().toString(36);
    const n = scenes.length + 1;
    const s = { name: `Scene ${n}`, file: uuid + ".element.json", type: "snippet", icon: "📜", order: Date.now(), uuid, content: "", reveals: [], sequenced_in: [manuscript.file], captured_in: [] };
    saveFile(dir + s.file, s);
    manuscript.sequences.push(s.file);
    saveFile(dir + manuscript.file, manuscript);
    focusFile.current = s.file;
    bump();
    return s;
  };
  // the first scene exists before the first keystroke
  useEffect(() => { if (manuscript && scenes.length === 0) newScene(); }, [manuscript && scenes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // focus the newest scene once it renders
  useEffect(() => {
    if (!focusFile.current || !docRef.current) return;
    const el = docRef.current.querySelector(`[data-scene="${focusFile.current}"] .page`);
    if (el) { el.focus(); focusFile.current = null; }
  });

  // keep the rendered object current too, or a re-render would hand the
  // editor its stale content and wipe what was just typed
  const saveScene = (snip) => (html) => {
    const cur = loadFile(dir + snip.file) || snip;
    cur.content = html;
    snip.content = html;
    saveFile(dir + cur.file, cur);
  };

  // Ctrl/Cmd+Enter, or a paragraph that is just ***, ends the scene
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); commitAll(); newScene(); }
  };
  const onInput = (e) => {
    const page = e.target.closest && e.target.closest(".page");
    if (!page) return;
    // the break line, ignoring the empty paragraph Enter just made after it
    let last = page.lastElementChild;
    const empties = [];
    while (last && !(last.textContent || "").replace(/[\s\u200b\u00a0]/g, "")) { empties.push(last); last = last.previousElementSibling; }
    // only once Enter has been pressed after the stars (an empty paragraph follows)
    if (last && empties.length && /^\s*(\*\s*){3,}\s*$/.test(last.textContent || "")) {
      last.remove();
      empties.forEach((e) => e.remove());
      if (!page.hasChildNodes()) page.innerHTML = "<p><br></p>";
      page.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => { commitAll(); newScene(); }, 0);
    }
  };
  const commitAll = () => { if (docRef.current) docRef.current.querySelectorAll(".page").forEach((p) => p.blur()); };

  const useBook = async () => {
    if (!book) return;
    commitAll();
    await flushNow();
    renameDir(state.project, book.replace(/[/\\?%*:|"<>]/g, ""));
    dispatch({ action: "setProject", payload: { name: book.replace(/[/\\?%*:|"<>]/g, "") } });
    clearSuggestedBook();
    setBook("");
  };

  const total = scenes.reduce((n, s) => n + words(s.content), 0);
  const emerged = actors.filter((a) => a.type !== "thread" && (a.type !== "snippet")).sort((a, b) => (b.updated || b.order || 0) - (a.updated || a.order || 0));
  const elements = emerged.filter((a) => a.type === "element");
  const facts = emerged.filter((a) => a.type === "fact");
  const cur = LEVELS.find((l) => l.id === level) || LEVELS[0];
  const nothingYet = emerged.length === 0 && total === 0;

  if (!dir) return null;
  return (
    <div className={"flowPage" + (side ? " has-side" : "") + (embedded ? " flowPage--embedded" : "")}>
      {!embedded && <FlowToasts dir={dir} project={state.project} />}
      <header className="flowPage__head">
        {!embedded && <Link to="/" className="flowPage__home" title="Projects" onClick={() => dispatch({ action: "setProject", payload: { name: "" } })}><img src={logo} alt="Silky" /></Link>}
        <div
          className="flowPage__title"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          title="The book's title — click to change"
          onBlur={(e) => { const n = e.currentTarget.textContent.replace(/[/\\?%*:|"<>]/g, "").trim(); if (n && n !== state.project) { renameDir(state.project, n); dispatch({ action: "setProject", payload: { name: n } }); } }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
        >{state.project}</div>
        <span className="flowPage__count">{total.toLocaleString()} words · {scenes.length} scene{scenes.length === 1 ? "" : "s"}</span>
        <span className="spacer" />
        <label className="flowPage__level" title={cur.blurb}>
          <SpinnerIcon />
          <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={!isConfigured()}>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id === "off" ? "Spinner off" : l.name}</option>)}
          </select>
        </label>
        {!isConfigured() && <Link className="flowPage__connect" to="/spinner/settings">Connect Spinner to let the bible emerge →</Link>}
        {!embedded && <Link className="flowPage__open" to="/elements" title="Open this in the full Silky view"><FaExternalLinkAlt /> Open in Silky</Link>}
        <button type="button" className="flowPage__sideBtn" onClick={() => { setSide((s) => { try { localStorage.setItem("silky:flow-side", s ? "0" : "1"); } catch (e) { /* */ } return !s; }); }} title={side ? "Hide what has emerged" : "Show what has emerged"}>{side ? <FaChevronRight /> : <FaChevronLeft />}</button>
      </header>

      <div className="flowPage__body">
        <div className="flowPage__doc" ref={docRef} onKeyDown={onKeyDown} onInput={onInput}>
          <EditorToolbar scopeRef={docRef} />
          <div className="threadDoc flowDoc">
            {scenes.map((snip, i) => (
              <section className="flowScene" key={snip.file} data-scene={snip.file}>
                {i > 0 && <div className="flowScene__rule" />}
                <div className="flowScene__name">{isPlaceholderScene(snip.name) ? <span className="muted">{snip.name}{isConfigured() && level !== "off" ? " — Spinner will name it" : ""}</span> : <Link to={"/elements/" + snip.file}>{snip.name}</Link>}</div>
                <TextEditor
                  variant="scene"
                  chrome={false}
                  data={snip.content}
                  actorUuid={snip.uuid}
                  save={saveScene(snip)}
                  placeholder={i === 0 ? "Start writing. Nothing to set up — the story bible builds itself as you go. Ctrl+Enter or a line of *** starts a new scene." : "Next scene…"}
                />
              </section>
            ))}
            <button type="button" className="flowDoc__next" onClick={() => { commitAll(); newScene(); }}>— new scene (Ctrl+Enter) —</button>
          </div>
        </div>

        {side && (
          <aside className="flowPage__side">
            <h4><SpinnerIcon /> What has emerged</h4>
            {book && isPlaceholderProject(state.project) && (
              <div className="flowSide__book">
                <p>Spinner suggests calling this book <b>{book}</b>.</p>
                <button type="button" className="primary" onClick={useBook}>Use it</button>
                <button type="button" onClick={() => { clearSuggestedBook(); setBook(""); }}>No</button>
              </div>
            )}
            {nothingYet && (
              <div className="flowSide__doors">
                <p className="muted">Just start typing on the left. Or:</p>
                <button type="button" onClick={() => setImporting(true)}><FaFileImport /> Import a manuscript</button>
                <button type="button" onClick={() => { dispatch({ action: "setProject", payload: { name: "" } }); navigate("/"); }}><FaBookOpen /> Open an example</button>
                <dl className="flowSide__primer">
                  {KINDS.map((k) => <div key={k.id}><dt>{k.glyph} {k.label}</dt><dd>{k.blurb}</dd></div>)}
                </dl>
              </div>
            )}
            <p className="flowSide__counts">{scenes.length} scene{scenes.length === 1 ? "" : "s"} · {elements.length} element{elements.length === 1 ? "" : "s"} · {facts.length} fact{facts.length === 1 ? "" : "s"}</p>
            {emerged.length === 0 && <p className="muted">{isConfigured() ? (level === "off" ? "Turn Spinner on (top right) and the people, places and facts in your writing will appear here." : "Keep writing. When you pause, Spinner reads what's new and the bible fills in here.") : "Connect Spinner and the people, places and facts in your writing will appear here as you write."}</p>}
            <ul className="flowSide__list">
              {emerged.slice(0, 60).map((a) => (
                <li key={a.file}><Link to={"/elements/" + a.file}><span>{a.icon}</span> {a.name}</Link>{a.type === "fact" && (a.involves || []).length > 0 && <small>{a.involves.map((f) => (byFile.get(f) || {}).name).filter(Boolean).join(", ")}</small>}</li>
              ))}
            </ul>
            {!embedded && <p className="flowSide__foot">Everything here is a normal Silky project — <Link to="/elements">open it</Link> for threads, webs, analyses and the wiki.</p>}
            {embedded && <p className="flowSide__foot">Everything Spinner makes is in the lists on the left; click anything to open it in a tab. The logo brings you back here.</p>}
          </aside>
        )}
        {importing && (
          <ImportManuscript
            into={state.project}
            onClose={() => setImporting(false)}
            onOpenSettings={() => { setImporting(false); navigate("/spinner/settings"); }}
            onDone={() => { setImporting(false); bump(); }}
          />
        )}
      </div>
    </div>
  );
};

export default FlowPage;
