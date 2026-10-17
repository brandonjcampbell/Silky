import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GiSpinningWheel } from "react-icons/gi";
import { FaPlus, FaTrash, FaPaperPlane, FaCopy, FaFileImport } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile, saveFile } from "../../utils/";
import { loadTalk, newConversation, updateConversation, deleteConversation, talk, titleFor, OPENERS } from "../../llm/talk";
import { getConfig, isConfigured } from "../../llm/config";
import { newId, wrapForInsert, recordInsertion } from "../../provenance";
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
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const configured = isConfigured();

  const actors = useMemo(() => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean), [dir, project, cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const byFile = useMemo(() => new Map(actors.map((a) => [a.file, a])), [actors]);
  const conv = data.conversations.find((c) => c.id === cur) || null;

  useEffect(() => { setData(loadTalk(dir)); }, [dir]);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: "end" }); }, [conv && conv.messages.length, busy]);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const refresh = (id) => { const d = loadTalk(dir); setData(d); if (id !== undefined) setCur(id); };

  const start = () => { const c = newConversation(dir); refresh(c.id); };
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

  const send = async (text) => {
    const content = (text || draft).trim();
    if (!content || busy) return;
    let c = conv || newConversation(dir);
    const first = c.messages.length === 0;
    c = { ...c, messages: [...c.messages, { role: "user", content, at: Date.now() }], title: first ? titleFor(content) : c.title };
    updateConversation(dir, c);
    refresh(c.id);
    setDraft("");
    setErr(null);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const reply = await talk({ project, actors, conversation: c, signal: ctrl.signal });
      const cfg = getConfig() || {};
      c = { ...c, messages: [...c.messages, { role: "assistant", content: reply, at: Date.now(), model: cfg.model }] };
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

  const focusActors = conv ? conv.focus.map((f) => byFile.get(f)).filter(Boolean) : [];
  const focusScenes = focusActors.filter((a) => a.type === "snippet");
  const options = useMemo(() => [...actors].filter((a) => a.type !== "web").sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)), [actors]);

  return (
    <div className="talk">
      <aside className="talk__side">
        <button type="button" className="talk__new" onClick={start}><FaPlus /> New conversation</button>
        <ul className="talk__list">
          {data.conversations.map((c) => (
            <li key={c.id} className={c.id === cur ? "is-active" : ""}>
              <button type="button" className="talk__item" onClick={() => setCur(c.id)}>
                <span className="talk__title">{c.title}</span>
                <span className="talk__when">{new Date(c.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {c.messages.length}</span>
              </button>
              <button type="button" className="talk__del" aria-label="Delete conversation" onClick={() => { if (window.confirm("Delete this conversation?")) remove(c.id); }}><FaTrash /></button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="talk__main">
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
        </div>

        <div className="talk__thread">
          {!configured && <p className="talk__empty">Connect Spinner (the <Link to="/spinner/settings">connection tab</Link>) to talk.</p>}
          {configured && (!conv || !conv.messages.length) && (
            <div className="talk__welcome">
              <GiSpinningWheel className="talk__bigIcon" />
              <p>Spinner knows the shape of <b>{project}</b> — its scenes, threads and cast. Bring the scene you're stuck on into the room, then talk. Spinner asks more than it tells; it won't write the scene unless you ask.</p>
              <div className="talk__openers">
                {OPENERS.map((o) => <button key={o.label} type="button" onClick={() => setDraft(o.text)}>{o.label}</button>)}
              </div>
            </div>
          )}
          {conv && conv.messages.map((m, i) => (
            <article key={i} className={"msg msg--" + m.role}>
              <div className="msg__who">{m.role === "assistant" ? <><GiSpinningWheel /> Spinner</> : "You"}</div>
              <div className="msg__body">{m.content.split(/\n{2,}/).map((p, j) => <p key={j}>{p}</p>)}</div>
              {m.role === "assistant" && (
                <div className="msg__actions">
                  <button type="button" onClick={() => copy(m.content)} title="Copy"><FaCopy /></button>
                  {focusScenes.map((s) => (
                    <button key={s.file} type="button" onClick={() => insertInto(s.file, m.content)} title={`Append to “${s.name}”, marked as Spinner’s`}><FaFileImport /> {s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name}</button>
                  ))}
                </div>
              )}
            </article>
          ))}
          {busy && <article className="msg msg--assistant is-thinking"><div className="msg__who"><GiSpinningWheel className="spin" /> Spinner</div><div className="msg__body"><p>…</p></div></article>}
          {err && <p className="talk__err">{err}</p>}
          <div ref={endRef} />
        </div>

        <form className="talk__compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={configured ? "Talk to Spinner about the book — Enter to send, Shift+Enter for a new line" : "Connect Spinner first"}
            rows={2}
            disabled={!configured}
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button>
          ) : (
            <button type="submit" className="primary" disabled={!draft.trim() || !configured}><FaPaperPlane /></button>
          )}
        </form>
      </section>
    </div>
  );
};

export default Talk;
