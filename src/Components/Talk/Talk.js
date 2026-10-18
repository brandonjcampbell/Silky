import SpinnerIcon from "../SpinnerIcon";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { FaPlus, FaTrash, FaPaperPlane, FaCopy, FaFileImport, FaComments, FaUserFriends } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile } from "../../utils/";
import { loadTalk, newConversation, updateConversation, deleteConversation, talk, castTalk, titleFor, OPENERS } from "../../llm/talk";
import { getConfig, isConfigured } from "../../llm/config";
import { newId, wrapForInsert, recordInsertion } from "../../provenance";
import { reviseScene } from "../../llm/revise";
import { parseHtml, sceneText, weave } from "../../revise";
import Revision from "../Revision";
import { isCharacter, roleOf } from "../../role";
import SortRoles from "../RolePicker/SortRoles";
import { extractActions, describeAction, applyAction } from "../../llm/actions";
import { FaCheck, FaUndo, FaMagic } from "react-icons/fa";
import "./Talk.css";

const TYPE_GLYPH = { snippet: "📜", element: "🧩", fact: "💡", thread: "🧵", web: "🕸️" };

/** Chat with Spinner about the book. Bring scenes, people and facts into the room; insert what helps. */
const Talk = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const project = state.project;
  const [data, setData] = useState(() => loadTalk(dir));
  const [cur, setCur] = useState(() => (data.conversations[0] ? data.conversations[0].id : null));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [pick, setPick] = useState("");
  const [castPick, setCastPick] = useState(null); // null | Set of element files while choosing
  const [weaving, setWeaving] = useState(null); // { msg, scene, result?, busy }
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const configured = isConfigured();
  const location = useLocation();
  const navigate = useNavigate();

  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, project, cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = useMemo(() => new Map(actors.map((a) => [a.file, a])), [actors]);
  const conv = data.conversations.find((c) => c.id === cur) || null;

  useEffect(() => { setData(loadTalk(dir)); }, [dir]);

  // Arrived from an actor's "talk about this" / "talk to" button: open a
  // conversation with it in the room (reusing a fresh one if it exists).
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const about = q.get("about");
    const withEl = q.get("with");
    if (!about && !withEl) return;
    const target = loadFile(dir + (about || withEl));
    if (!target) { navigate("/spinner", { replace: true }); return; }
    const d = loadTalk(dir);
    let c;
    if (about) {
      c = d.conversations.find((x) => x.kind !== "cast" && x.focus.length === 1 && x.focus[0] === target.file && x.messages.length === 0);
      if (!c) c = newConversation(dir, `About ${target.name}`, { kind: "spinner", focus: [target.file] });
    } else {
      c = d.conversations.find((x) => x.kind === "cast" && (x.participants || []).length === 1 && x.participants[0] === target.file);
      if (!c) c = newConversation(dir, target.name, { kind: "cast", participants: [target.file], asOf: null });
    }
    setData(loadTalk(dir));
    setCur(c.id);
    navigate("/spinner", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: "end" }); }, [conv && conv.messages.length, busy]);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const refresh = (id) => { const d = loadTalk(dir); setData(d); if (id !== undefined) setCur(id); };

  const start = () => { const c = newConversation(dir); refresh(c.id); };
  const startCast = () => {
    const files = [...castPick];
    if (!files.length) return;
    const names = files.map((f) => (byFile.get(f) || {}).name).filter(Boolean);
    const c = newConversation(dir, names.join(", "), { kind: "cast", participants: files, asOf: null });
    setCastPick(null);
    refresh(c.id);
  };
  const addParticipant = (file) => {
    if (!file || !conv) return;
    const c = { ...conv, participants: [...new Set([...(conv.participants || []), file])] };
    c.title = c.participants.map((f) => (byFile.get(f) || {}).name).filter(Boolean).join(", ");
    updateConversation(dir, c); refresh(); setPick("");
  };
  const dropParticipant = (file) => {
    const c = { ...conv, participants: conv.participants.filter((f) => f !== file) };
    updateConversation(dir, c); refresh();
  };
  const setAsOf = (v) => { const c = { ...conv, asOf: v === "" ? null : Number(v) }; updateConversation(dir, c); refresh(); };
  const remove = (id) => { deleteConversation(dir, id); const d = loadTalk(dir); setData(d); setCur(d.conversations[0] ? d.conversations[0].id : null); };

  const addFocus = (file) => {
    if (!file) return;
    let c = conv;
    if (!c) c = newConversation(dir);
    if (!c.focus.includes(file)) c = { ...c, focus: [...c.focus, file] };
    updateConversation(dir, c);
    refresh(c.id);
    setPick("");
  };
  const dropFocus = (file) => {
    const c = { ...conv, focus: conv.focus.filter((f) => f !== file) };
    updateConversation(dir, c);
    refresh();
  };

  const send = async (text, { nudge = false } = {}) => {
    const content = (text || draft).trim();
    if ((!content && !nudge) || busy) return;
    let c = conv || newConversation(dir);
    const isCast = c.kind === "cast";
    const first = c.messages.length === 0;
    if (!nudge) {
      c = { ...c, messages: [...c.messages, { role: "user", content, at: Date.now() }], title: first && !isCast ? titleFor(content) : c.title };
      updateConversation(dir, c);
      refresh(c.id);
    }
    setDraft("");
    setErr(null);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const cfg = getConfig() || {};
      if (isCast) {
        const lines = await castTalk({ project, actors, conversation: c, nudge, signal: ctrl.signal });
        c = { ...c, messages: [...c.messages, { role: "assistant", lines, content: lines.map((l) => `${(byFile.get(l.speaker) || {}).name}: ${l.text}`).join("\n"), at: Date.now(), model: cfg.model }] };
      } else {
        const reply = await talk({ project, actors, conversation: c, signal: ctrl.signal });
        const { text: shown, actions, truncated } = extractActions(reply);
        c = { ...c, messages: [...c.messages, { role: "assistant", content: reply, shown: actions.length || truncated ? shown : undefined, actions: actions.length ? actions.map((a) => ({ a, state: "proposed" })) : undefined, truncated: truncated || undefined, at: Date.now(), model: cfg.model }] };
      }
      updateConversation(dir, c);
      refresh(c.id);
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (t) => { try { await navigator.clipboard.writeText(t); } catch (e) { /* ignore */ } };

  /** Append a reply to a focused scene, marked as Spinner's. */
  const insertInto = (sceneFile, text) => {
    const s = loadFile(dir + sceneFile);
    if (!s || typeof s.content !== "string") return;
    const id = newId();
    s.content = (s.content || "") + `<p>${wrapForInsert(text, id)}</p>`;
    saveFile(dir + s.file, s);
    const cfg = getConfig() || {};
    recordInsertion(dir, { id, file: s.file, kind: "talk", prompt: conv ? conv.title : "", text, provider: cfg.provider, model: cfg.model });
    window.alert(`Added to “${s.name}”, marked as Spinner’s.`);
  };

  /** Have Spinner work a reply into a scene; show the delta, apply on request. */
  const weaveInto = async (sceneFile, msgIndex, text) => {
    const s = loadFile(dir + sceneFile);
    if (!s || typeof s.content !== "string") return;
    setWeaving({ msg: msgIndex, scene: s.file, busy: true });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const root = parseHtml(s.content);
      const t = sceneText(root, null);
      const direction = `Integrate the following into the scene where it fits best, in the manuscript's own voice (it came out of a conversation about the book, so adapt it rather than paste it): ${text}`;
      const revised = await reviseScene({ snippet: s, actors, direction, text: t, signal: ctrl.signal });
      const result = weave({ root: parseHtml(s.content), revisedText: revised, selection: null });
      setWeaving({ msg: msgIndex, scene: s.file, result, busy: false, direction });
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
      setWeaving(null);
    }
  };
  const applyWeave = () => {
    if (!weaving || !weaving.result) return;
    const s = loadFile(dir + weaving.scene);
    if (!s) return;
    s.content = weaving.result.html;
    saveFile(dir + s.file, s);
    if (weaving.result.added) {
      const cfg = getConfig() || {};
      recordInsertion(dir, { id: weaving.result.id, file: s.file, kind: "talk-revise", prompt: weaving.direction, text: weaving.result.addedText, provider: cfg.provider, model: cfg.model, removed: weaving.result.removed });
    }
    setWeaving(null);
    window.alert(`Woven into “${s.name}” — ${weaving.result.added} new word${weaving.result.added === 1 ? "" : "s"} marked as Spinner’s.`);
  };

  /** Apply one of Spinner's proposed actions (or undo it). */
  const undoRef = useRef(new Map());
  const runActions = (mi, indices) => {
    if (!conv) return;
    const m = conv.messages[mi];
    const results = new Map();
    indices.forEach((ai) => {
      const r = applyAction(dir, m.actions[ai].a, { navigate, project, currentTab: "spinner" });
      if (r.ok && r.undo) undoRef.current.set(`${conv.id}:${mi}:${ai}`, r.undo);
      results.set(ai, r);
    });
    const actions = m.actions.map((x, k) => (results.has(k) ? { ...x, state: results.get(k).ok ? "done" : "failed", result: results.get(k).message } : x));
    const c = { ...conv, messages: conv.messages.map((x, k) => (k === mi ? { ...x, actions } : x)) };
    updateConversation(dir, c); refresh(c.id);
    window.dispatchEvent(new CustomEvent("silky-flow-changed"));
  };
  const runAction = (mi, ai) => runActions(mi, [ai]);
  const undoAction = (mi, ai) => {
    const u = undoRef.current.get(`${conv.id}:${mi}:${ai}`);
    if (u) { try { u(); } catch (e) { /* */ } undoRef.current.delete(`${conv.id}:${mi}:${ai}`); }
    const m = conv.messages[mi];
    const actions = m.actions.map((x, k) => (k === ai ? { ...x, state: "proposed", result: undefined } : x));
    const c = { ...conv, messages: conv.messages.map((x, k) => (k === mi ? { ...x, actions } : x)) };
    updateConversation(dir, c); refresh(c.id);
    window.dispatchEvent(new CustomEvent("silky-flow-changed"));
  };
  const runAll = (mi) => runActions(mi, conv.messages[mi].actions.map((x, ai) => (x.state === "proposed" ? ai : -1)).filter((ai) => ai >= 0));

  const isCast = !!(conv && conv.kind === "cast");
  const participants = conv ? (conv.participants || []).map((f) => byFile.get(f)).filter(Boolean) : [];
  const elementsAll = useMemo(() => [...actors].filter((a) => a.type === "element").sort((a, b) => (b.involved_in || []).length - (a.involved_in || []).length), [actors]);
  const manuScenes = useMemo(() => {
    const threads = actors.filter((a) => a.type === "thread");
    const manu = threads.find((t) => t.name === "Manuscript") || [...threads].sort((a, b) => b.sequences.length - a.sequences.length)[0];
    return manu ? manu.sequences.map((f) => byFile.get(f)).filter(Boolean) : [];
  }, [actors, byFile]);
  const focusActors = conv ? conv.focus.map((f) => byFile.get(f)).filter(Boolean) : [];
  const focusScenes = focusActors.filter((a) => a.type === "snippet");
  const options = useMemo(() => [...actors].filter((a) => a.type !== "web").sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)), [actors]);

  return (
    <div className="talk">
      <aside className="talk__side">
        <button type="button" className="talk__new" onClick={start} title="Talk about the book — or ask Spinner to make, link, rename, split, merge, move or date things; it proposes the changes and you apply them"><FaComments /> Talk to Spinner</button>
        <button type="button" className="talk__new" onClick={() => setCastPick(new Set())}><FaUserFriends /> Talk to characters</button>
        {castPick && (
          <div className="castPick">
            <p>Who's in the room?</p>
            <div className="castPick__list">
              {elementsAll.filter(isCharacter).map((e) => (
                <label key={e.file}><input type="checkbox" checked={castPick.has(e.file)} onChange={(ev) => { const n = new Set(castPick); if (ev.target.checked) n.add(e.file); else n.delete(e.file); setCastPick(n); }} /> {e.icon} {e.name}</label>
              ))}
              {elementsAll.some((e) => !isCharacter(e)) && <p className="castPick__sub">Places and things — present, not speaking</p>}
              {elementsAll.filter((e) => !isCharacter(e)).map((e) => (
                <label key={e.file} className="is-thing"><input type="checkbox" checked={castPick.has(e.file)} onChange={(ev) => { const n = new Set(castPick); if (ev.target.checked) n.add(e.file); else n.delete(e.file); setCastPick(n); }} /> {e.icon} {e.name} <small>{roleOf(e) === "location" ? "place" : "thing"}</small></label>
              ))}
            </div>
            <p className="castPick__hint">Only characters speak. Mark an element as a character on its page (Character / Location / Thing) to give it a voice. <SortRoles onDone={() => setCastPick(new Set(castPick))} /></p>
            <div className="castPick__row">
              <button type="button" className="primary" disabled={!castPick.size} onClick={startCast}>Start</button>
              <button type="button" onClick={() => setCastPick(null)}>Cancel</button>
            </div>
          </div>
        )}
        <ul className="talk__list">
          {data.conversations.map((c) => (
            <li key={c.id} className={c.id === cur ? "is-active" : ""}>
              <button type="button" className="talk__item" onClick={() => setCur(c.id)}>
                <span className="talk__title">{c.kind === "cast" ? "👥 " : ""}{c.title}</span>
                <span className="talk__when">{new Date(c.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {c.messages.length}</span>
              </button>
              <button type="button" className="talk__del" aria-label="Delete conversation" onClick={() => { if (window.confirm("Delete this conversation?")) remove(c.id); }}><FaTrash /></button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="talk__main">
        {isCast && (
          <div className="talk__focus">
            <span className="talk__focusLabel">Speaking:</span>
            {participants.map((a) => (
              <span key={a.file} className="talk__chip talk__chip--cast">
                <Link to={"/elements/" + a.file}>{a.icon} {a.name}</Link>
                {participants.length > 1 && <button type="button" aria-label="Remove" onClick={() => dropParticipant(a.file)}>×</button>}
              </span>
            ))}
            <select value={pick} onChange={(e) => addParticipant(e.target.value)} aria-label="Add a character">
              <option value="">+ add someone…</option>
              {elementsAll.filter((e) => !(conv.participants || []).includes(e.file)).map((e) => <option key={e.file} value={e.file}>{e.icon} {e.name}</option>)}
            </select>
            {manuScenes.length > 0 && (
              <label className="talk__asOf">as of
                <select value={conv.asOf == null ? "" : conv.asOf} onChange={(e) => setAsOf(e.target.value)}>
                  <option value="">the whole book</option>
                  {manuScenes.map((s, i) => <option key={s.file} value={i}>{i + 1}. {s.name}</option>)}
                </select>
              </label>
            )}
          </div>
        )}
        {!isCast && (
        <div className="talk__focus">
          <span className="talk__focusLabel">In the room:</span>
          {focusActors.map((a) => (
            <span key={a.file} className="talk__chip">
              <Link to={"/elements/" + a.file}>{TYPE_GLYPH[a.type]} {a.icon} {a.name}</Link>
              <button type="button" aria-label="Remove" onClick={() => dropFocus(a.file)}>×</button>
            </span>
          ))}
          <select value={pick} onChange={(e) => addFocus(e.target.value)} aria-label="Bring something into the conversation">
            <option value="">+ bring in a scene, person, fact or thread…</option>
            {options.map((a) => <option key={a.file} value={a.file}>{TYPE_GLYPH[a.type]} {a.name}</option>)}
          </select>
          <span className="talk__knows" title="Spinner always has a digest of the project: the scene list, plot threads, principal elements and counts. Bring something in to give it the full text.">
            Spinner knows the digest — {actors.filter((a) => a.type === "snippet").length} scenes, {actors.filter((a) => a.type === "element").length} elements, {actors.filter((a) => a.type === "fact").length} facts{focusActors.length ? "" : "; bring something in for its full text"}.
          </span>
        </div>
        )}

        <div className="talk__thread">
          {!configured && <p className="talk__empty">Connect Spinner (the <Link to="/spinner/settings">connection tab</Link>) to talk.</p>}
          {configured && isCast && !conv.messages.length && (
            <div className="talk__welcome">
              <div className="talk__faces">{participants.map((a) => <span key={a.file} title={a.name}>{a.icon}</span>)}</div>
              <p>{participants.filter(isCharacter).map((a) => a.name).join(", ") || "No one who can speak"} {participants.filter(isCharacter).length === 1 ? "is" : "are"} in the room{participants.some((a) => !isCharacter(a)) ? `, with ${participants.filter((a) => !isCharacter(a)).map((a) => a.name).join(", ")} present but not sentient` : ""}. They know only what the project says they know{conv.asOf != null ? ` as of scene ${conv.asOf + 1}` : ""} — ask them anything, or press <b>Let them talk</b> and listen.</p>
            </div>
          )}
          {configured && !isCast && (!conv || !conv.messages.length) && (
            <div className="talk__welcome">
              <SpinnerIcon className="talk__bigIcon" />
              <p>Spinner knows the shape of <b>{project}</b> — its scenes, threads and cast. Bring the scene you're stuck on into the room, then talk. Spinner asks more than it tells; it won't write the scene unless you ask.</p>
              <div className="talk__openers">
                {OPENERS.map((o) => <button key={o.label} type="button" onClick={() => setDraft(o.text)}>{o.label}</button>)}
              </div>
            </div>
          )}
          {conv && conv.messages.map((m, i) => (
            m.role === "assistant" && m.lines ? (
              <div key={i} className="script">
                {m.lines.map((l, j) => { const el = byFile.get(l.speaker); return (
                  <article key={j} className="msg msg--assistant msg--cast">
                    <div className="msg__who"><span className="msg__face">{el ? el.icon : "?"}</span> {el ? el.name : "?"}</div>
                    <div className="msg__body"><p>{l.text}</p></div>
                  </article>
                ); })}
                <div className="msg__actions"><button type="button" onClick={() => copy(m.content)} title="Copy this exchange"><FaCopy /></button></div>
              </div>
            ) : (
            <article key={i} className={"msg msg--" + m.role}>
              <div className="msg__who">{m.role === "assistant" ? <><SpinnerIcon /> Spinner</> : "You"}</div>
              <div className="msg__body">{(m.shown != null ? m.shown : m.content).split(/\n{2,}/).filter((p) => p.trim()).map((p, j) => <p key={j}>{p}</p>)}</div>
              {m.truncated && !(m.actions && m.actions.length) && <p className="actions__cut">Spinner's reply was cut off before its changes were complete. Ask again, or ask for fewer at once.</p>}
              {m.actions && m.actions.length > 0 && (
                <div className="actions">
                  <div className="actions__head"><FaMagic /> Spinner proposes {m.actions.length} change{m.actions.length === 1 ? "" : "s"}{m.truncated && <em className="actions__cut">reply was cut off — these are the complete ones</em>}{m.actions.some((x) => x.state === "proposed") && m.actions.length > 1 && <button type="button" className="primary" onClick={() => runAll(i)}>Apply all</button>}</div>
                  <ul>
                    {m.actions.map((x, ai) => (
                      <li key={ai} className={"actions__item is-" + x.state}>
                        <span className="actions__desc">{describeAction(dir, x.a)}{x.result && <small>{x.result}</small>}</span>
                        {x.state === "proposed" && <button type="button" className="primary" onClick={() => runAction(i, ai)}><FaCheck /> Apply</button>}
                        {x.state === "done" && undoRef.current.has(`${conv.id}:${i}:${ai}`) && <button type="button" onClick={() => undoAction(i, ai)}><FaUndo /> Undo</button>}
                        {x.state === "done" && !undoRef.current.has(`${conv.id}:${i}:${ai}`) && <span className="actions__done">done</span>}
                        {x.state === "failed" && <button type="button" onClick={() => runAction(i, ai)}>Retry</button>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {m.role === "assistant" && (
                <div className="msg__actions">
                  <button type="button" onClick={() => copy(m.content)} title="Copy"><FaCopy /></button>
                  {focusScenes.map((s) => (
                    <React.Fragment key={s.file}>
                      <button type="button" onClick={() => insertInto(s.file, m.content)} title={`Append to “${s.name}” as a marked paragraph`}><FaFileImport /> Append to {s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name}</button>
                      <button type="button" disabled={!!(weaving && weaving.busy)} onClick={() => weaveInto(s.file, i, m.content)} title={`Spinner rewrites “${s.name}” to work this in; you see the delta first and only the new words count as Spinner’s`}><SpinnerIcon /> Weave into {s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name}</button>
                    </React.Fragment>
                  ))}
                </div>
              )}
              {weaving && weaving.msg === i && weaving.busy && <p className="talk__weaving"><SpinnerIcon className="spin" /> Spinner is working it into the scene…</p>}
              {weaving && weaving.msg === i && weaving.result && (
                <Revision result={weaving.result} sceneName={(byFile.get(weaving.scene) || {}).name} onApply={applyWeave} onDiscard={() => setWeaving(null)} />
              )}
            </article>
            )
          ))}
          {busy && <article className="msg msg--assistant is-thinking"><div className="msg__who"><SpinnerIcon className="spin" /> Spinner</div><div className="msg__body"><p>…</p></div></article>}
          {err && <p className="talk__err">{err}</p>}
          <div ref={endRef} />
        </div>

        <form className="talk__compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={!configured ? "Connect Spinner first" : isCast ? `Say something to ${participants.map((a) => a.name).join(" and ")} — Enter to send` : "Talk to Spinner about the book — Enter to send, Shift+Enter for a new line"}
            rows={2}
            disabled={!configured}
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button>
          ) : (
            <>
              {isCast && <button type="button" onClick={() => send("", { nudge: true })} disabled={!configured} title="Say nothing; let them carry on">Let them talk</button>}
              <button type="submit" className="primary" disabled={!draft.trim() || !configured}><FaPaperPlane /></button>
            </>
          )}
        </form>
      </section>
    </div>
  );
};

export default Talk;
