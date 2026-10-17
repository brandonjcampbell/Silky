import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GiSpinningWheel } from "react-icons/gi";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { askIdeas, IDEA_KINDS } from "../../llm/ideas";
import { getConfig, isConfigured } from "../../llm/config";
import { newId, wrapForInsert, recordInsertion, getShowAi, setShowAi, applyShowAi } from "../../provenance";
import "./Ideas.css";

/**
 * Ask Spinner for ideas about this scene. Inserted suggestions are wrapped as
 * AI-written and logged, so they can be found, un-marked or removed later.
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
  const abortRef = useRef(null);
  const configured = isConfigured();

  useEffect(() => { applyShowAi(); }, []);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

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

  return (
    <section className={"ideas" + (open ? " is-open" : "")}>
      <div className="ideas__bar">
        <button type="button" className="ideas__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <GiSpinningWheel /> Ask Spinner for ideas
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
                  onKeyDown={(e) => e.key === "Enter" && !busy && ask()}
                  placeholder={kind === "custom" ? "What do you want to know or try?" : "Anything to steer it? (optional)"}
                />
                {!busy && <button type="button" className="primary" onClick={ask} disabled={kind === "custom" && !question.trim()}>Ask</button>}
                {busy && <><span className="muted">Spinner is thinking…</span><button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button></>}
              </div>
              {err && <p className="ideas__err">{err}</p>}
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
                        <button type="button" onClick={() => copy(idea)}>Copy</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="ideas__note">Anything you insert is marked as Spinner’s and logged. Rewrite it and the mark stays until you un-mark it; the report shows how much of each scene still traces to Spinner.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Ideas;
