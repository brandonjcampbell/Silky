import SpinnerIcon from "../SpinnerIcon";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { askIdeas, IDEA_KINDS } from "../../llm/ideas";
import { getConfig, isConfigured } from "../../llm/config";
import { newId, wrapForInsert, recordInsertion, getShowAi, setShowAi, applyShowAi } from "../../provenance";
import { reviseScene } from "../../llm/revise";
import { sceneText, weave } from "../../revise";
import Revision from "../Revision";
import "./Ideas.css";

const PAGE_SEL = ".workspace .contentBlock--scene .page[contenteditable]";
const countWords = (s) => (String(s).match(/\S+/g) || []).length;

/**
 * Ask Spinner for ideas about this scene. Inserted suggestions are wrapped as
 * AI-written and logged, so they can be found, un-marked or removed later.
 * Ideas can also be woven in — Spinner revises the scene (or the selected
 * passage) and only the words that are actually new are marked as its.
 */
const Ideas = ({ element, onChange }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("next");
  const [question, setQuestion] = useState("");
  const [ideas, setIdeas] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [showAi, setShow] = useState(getShowAi());
  const [inserted, setInserted] = useState(new Set());
  const [revision, setRevision] = useState(null); // { result, direction }
  const [selWords, setSelWords] = useState(0);
  const selRef = useRef(null); // last non-empty selection inside the scene
  const abortRef = useRef(null);
  const configured = isConfigured();

  useEffect(() => { applyShowAi(); }, []);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  // remember the writer's selection in the scene; it survives clicks on our buttons
  useEffect(() => {
    const onSel = () => {
      const page = document.querySelector(PAGE_SEL);
      const sel = window.getSelection();
      if (!page || !sel || !sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      if (!page.contains(r.commonAncestorContainer)) return;
      if (r.collapsed) { selRef.current = null; setSelWords(0); return; }
      selRef.current = r.cloneRange();
      setSelWords(countWords(r.toString()));
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);
  const clearSel = () => { selRef.current = null; setSelWords(0); };

  /** Ask Spinner to revise the scene (or the selected passage) and preview the delta. */
  const revise = async (direction) => {
    const page = document.querySelector(PAGE_SEL);
    if (!page || !direction.trim()) return;
    setErr(null);
    setBusy(true);
    setRevision(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const selection = selRef.current && page.contains(selRef.current.commonAncestorContainer) ? selRef.current : null;
    try {
      const actors = loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
      const snippet = loadFile(dir + element.file) || element;
      const text = sceneText(page, selection);
      const revised = await reviseScene({ snippet, actors, direction, text, signal: ctrl.signal });
      const result = weave({ root: page, revisedText: revised, selection });
      setRevision({ result, direction });
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const applyRevision = () => {
    const page = document.querySelector(PAGE_SEL);
    if (!page || !revision) return;
    const { result, direction } = revision;
    page.innerHTML = result.html;
    page.focus();
    page.dispatchEvent(new Event("input", { bubbles: true }));
    if (result.added) {
      const c = getConfig() || {};
      recordInsertion(dir, { id: result.id, file: element.file, kind: "revise", prompt: direction, text: result.addedText, provider: c.provider, model: c.model, removed: result.removed });
    }
    setRevision(null);
    clearSel();
    onChange && onChange();
  };

  const ask = async () => {
    setErr(null);
    setBusy(true);
    setIdeas(null);
    setInserted(new Set());
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const actors = loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
      const snippet = loadFile(dir + element.file) || element;
      setIdeas(await askIdeas({ snippet, actors, kindId: kind, question: kind === "custom" || question.trim() ? question.trim() : "", signal: ctrl.signal }));
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Insert as new paragraphs after the paragraph holding the caret (or at the
   * end). Done with DOM nodes, not execCommand, because Chrome strips the
   * wrapper span when it merges inserted HTML into an existing paragraph.
   */
  const insert = (idea, i) => {
    const page = document.querySelector(".workspace .contentBlock--scene .page[contenteditable]");
    if (!page) return;
    const id = newId();
    const frag = document.createRange().createContextualFragment(`<p>${wrapForInsert(idea.text, id)}</p>`);
    const nodes = [...frag.childNodes];
    const sel = window.getSelection();
    let anchor = null;
    if (sel && sel.rangeCount && page.contains(sel.anchorNode)) {
      let n = sel.anchorNode;
      while (n && n.parentNode !== page) n = n.parentNode;
      anchor = n && n !== page ? n : null;
    }
    if (anchor) anchor.after(...nodes);
    else page.append(...nodes);
    // caret after the insertion
    const last = nodes[nodes.length - 1];
    const r = document.createRange();
    r.selectNodeContents(last);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
    page.focus();
    page.dispatchEvent(new Event("input", { bubbles: true }));
    const c = getConfig() || {};
    recordInsertion(dir, { id, file: element.file, kind, prompt: question.trim(), text: idea.text, provider: c.provider, model: c.model });
    setInserted((s) => new Set([...s, i]));
    onChange && onChange();
  };

  const copy = async (idea) => {
    try { await navigator.clipboard.writeText(idea.text); } catch (e) { /* ignore */ }
  };

  const toggleShow = () => { setShowAi(!showAi); setShow(!showAi); };
  const kindDef = IDEA_KINDS.find((k) => k.id === kind) || IDEA_KINDS[0];
  const go = () => (kindDef.revise ? revise(question) : ask());
  const weaveIdea = (idea) => revise(`Integrate this idea into the ${selWords ? "passage" : "scene"}, where it fits best, in the manuscript's own voice: ${idea.title ? idea.title + " — " : ""}${idea.text}${idea.why ? ` (${idea.why})` : ""}`);

  return (
    <section className={"ideas" + (open ? " is-open" : "")}>
      <div className="ideas__bar">
        <button type="button" className="ideas__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <SpinnerIcon /> Ask Spinner for ideas
        </button>
        <label className="ideas__show" title="Underline every passage that came from Spinner">
          <input type="checkbox" checked={showAi} onChange={toggleShow} /> Show AI text
        </label>
        <Link className="ideas__report" to="/analysis/influence">AI influence report</Link>
      </div>

      {open && (
        <div className="ideas__body">
          {!configured && <p className="muted">Connect Spinner (the spinning-wheel tab → Connection) to ask for ideas.</p>}
          {configured && (
            <>
              <div className="ideas__kinds" role="tablist">
                {IDEA_KINDS.map((k) => (
                  <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={"ideas__kind" + (kind === k.id ? " is-active" : "")} onClick={() => setKind(k.id)}>{k.name}</button>
                ))}
              </div>
              <div className="ideas__ask">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && go()}
                  placeholder={kindDef.revise ? "How should it change? e.g. tighten the dialogue; make the rain matter" : kind === "custom" ? "What do you want to know or try?" : "Anything to steer it? (optional)"}
                />
                {!busy && <button type="button" className="primary" onClick={go} disabled={(kind === "custom" || kindDef.revise) && !question.trim()}>{kindDef.revise ? "Revise" : "Ask"}</button>}
                {busy && <><span className="muted">Spinner is thinking…</span><button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button></>}
              </div>
              <p className="ideas__scope">
                {selWords
                  ? <>Working on your selection ({selWords} word{selWords === 1 ? "" : "s"}). <button type="button" className="ideas__link" onClick={clearSel}>Whole scene instead</button></>
                  : <>Revisions touch the whole scene — select a passage first to keep the change there.</>}
              </p>
              {err && <p className="ideas__err">{err}</p>}
              {revision && <Revision result={revision.result} busy={busy} sceneName={element.name} onApply={applyRevision} onDiscard={() => setRevision(null)} />}
              {ideas && ideas.length === 0 && <p className="muted">Spinner had nothing to offer. Try steering it.</p>}
              {ideas && ideas.length > 0 && (
                <div className="ideas__cards">
                  {ideas.map((idea, i) => (
                    <article key={i} className={"idea" + (inserted.has(i) ? " is-inserted" : "")}>
                      {idea.title && <h5>{idea.title}</h5>}
                      <p className="idea__text">{idea.text}</p>
                      {idea.why && <p className="idea__why">{idea.why}</p>}
                      <div className="idea__actions">
                        {kindDef.insertable && (
                          <button type="button" className="primary" disabled={inserted.has(i)} onClick={() => insert(idea, i)} title="Insert at the cursor (or the end of the scene), marked as AI-written">
                            {inserted.has(i) ? "Inserted" : "Insert"}
                          </button>
                        )}
                        <button type="button" onClick={() => weaveIdea(idea)} disabled={busy} title="Spinner rewrites the scene to work this in; you see the delta before anything changes, and only the new words count as Spinner's"><SpinnerIcon /> Weave in</button>
                        <button type="button" onClick={() => copy(idea)}>Copy</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="ideas__note">Insert drops a suggestion in as a marked paragraph. Weave in (and Revise) rewrites the text instead: you see the delta first, and only the words that are actually new are marked as Spinner’s — your own words keep their place and provenance. The report shows how much of each scene still traces to Spinner.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Ideas;
