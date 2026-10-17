import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaChartBar, FaTachometerAlt, FaFeatherAlt, FaBookReader, FaFingerprint } from "react-icons/fa";
import { loadProvenance, insertionStatus, aiWords, removeFromHtml, unmarkInHtml, getShowAi, setShowAi } from "../../provenance";
import { saveFile } from "../../utils/";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { plain, wordCount, styleStats, dialogueRatio, sentences, fmt, pct } from "../../analysis/text";
import { loadReader, runReader, clearReader, READERS, allReaders, readerById, addCustomReader, removeReader, updateReader, resetReader, hideReader, unhideAll, duplicateReader, personaText, EMPTY_PROFILE } from "../../analysis/reader";
import { isConfigured } from "../../llm/config";
import "./Analysis.css";

export const ANALYSES = [
  { id: "wordcount", name: "Word count", icon: FaChartBar, blurb: "Totals, and every scene and thread measured." },
  { id: "pacing", name: "Pacing", icon: FaTachometerAlt, blurb: "Scene lengths, dialogue and sentence rhythm across the book." },
  { id: "style", name: "Style", icon: FaFeatherAlt, blurb: "Sentence length, dialogue, adverbs, filter words, vocabulary." },
  { id: "reader", name: "Reader", icon: FaBookReader, blurb: "A model reads it cold and tells you how it landed." },
  { id: "influence", name: "AI influence", icon: FaFingerprint, blurb: "Every passage Spinner wrote, where it is now, and how to take it out." },
];

export const analysisById = (id) => ANALYSES.find((a) => a.id === id);

/* ── data helpers ─────────────────────────────────────────────────────── */

const useProject = (tick = 0) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const actors = useMemo(
    () => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir, state.project, tick]
  );
  const threads = actors.filter((a) => a.type === "thread").sort((a, b) => b.sequences.length - a.sequences.length);
  const snippets = actors.filter((a) => a.type === "snippet").sort((a, b) => a.order - b.order);
  const byFile = new Map(actors.map((a) => [a.file, a]));
  return { dir, actors, threads, snippets, byFile };
};

const scenesOf = (thread, snippets, byFile) =>
  thread ? thread.sequences.map((f) => byFile.get(f)).filter((a) => a && a.type === "snippet") : snippets;

const ThreadPicker = ({ threads, value, onChange, allLabel = "All scenes, in list order" }) => (
  <label className="analysis__pick">
    <span>Measure</span>
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {threads.map((t) => (
        <option key={t.file} value={t.file}>{t.icon} {t.name} ({t.sequences.length})</option>
      ))}
    </select>
  </label>
);

const useThreadChoice = (threads) => {
  const def = threads.find((t) => t.name === "Manuscript") || threads[0];
  const [choice, setChoice] = useState(def ? def.file : "");
  useEffect(() => { setChoice(def ? def.file : ""); }, [def && def.file]); // eslint-disable-line react-hooks/exhaustive-deps
  return [choice, setChoice];
};

const Stat = ({ label, value, sub }) => (
  <div className="stat">
    <b>{value}</b>
    <span>{label}</span>
    {sub && <small>{sub}</small>}
  </div>
);

/* ── Word count ───────────────────────────────────────────────────────── */

const WordCount = () => {
  const { threads, snippets, byFile } = useProject();
  const [choice, setChoice] = useThreadChoice(threads);
  const thread = byFile.get(choice);
  const scenes = scenesOf(thread, snippets, byFile);
  const rows = scenes.map((s) => ({ s, words: wordCount(plain(s.content)) }));
  const total = rows.reduce((n, r) => n + r.words, 0);
  const max = Math.max(1, ...rows.map((r) => r.words));
  const allWords = snippets.reduce((n, s) => n + wordCount(plain(s.content)), 0);
  const notesWords = useProject().actors.filter((a) => a.type !== "snippet" && typeof a.content === "string").reduce((n, a) => n + wordCount(plain(a.content)), 0);

  return (
    <div className="analysis">
      <ThreadPicker threads={threads} value={choice} onChange={setChoice} />
      <div className="stats">
        <Stat label="words in these scenes" value={fmt(total)} sub={`≈ ${fmt(total / 250)} min to read`} />
        <Stat label="scenes" value={fmt(rows.length)} sub={rows.length ? `avg ${fmt(total / rows.length)} words` : ""} />
        <Stat label="words in all scenes" value={fmt(allWords)} sub={`${fmt(snippets.length)} scenes in the project`} />
        <Stat label="words of notes" value={fmt(notesWords)} sub="elements, facts, thread notes" />
      </div>

      {threads.length > 0 && (
        <>
          <h3>Threads</h3>
          <table className="analysis__table">
            <thead><tr><th>Thread</th><th className="num">Scenes</th><th className="num">Words</th><th className="num">Minutes</th></tr></thead>
            <tbody>
              {threads.map((t) => {
                const w = scenesOf(t, snippets, byFile).reduce((n, s) => n + wordCount(plain(s.content)), 0);
                return (
                  <tr key={t.file}>
                    <td><Link to={"/elements/" + t.file}>{t.icon} {t.name}</Link></td>
                    <td className="num">{fmt(t.sequences.length)}</td>
                    <td className="num">{fmt(w)}</td>
                    <td className="num">{fmt(w / 250)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h3>Scenes</h3>
      <table className="analysis__table">
        <thead><tr><th>#</th><th>Scene</th><th className="num">Words</th><th className="bar"></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.s.file}>
              <td className="num muted">{i + 1}</td>
              <td><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link></td>
              <td className="num">{fmt(r.words)}</td>
              <td className="bar"><i style={{ width: `${(r.words / max) * 100}%` }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Pacing ───────────────────────────────────────────────────────────── */

const Chart = ({ series, labels, height = 180, format = (v) => fmt(v), unit = "", max: fixedMax }) => {
  const w = 900;
  const padL = 44, padR = 12, padT = 10, padB = 24;
  const n = series.length;
  const max = fixedMax || Math.max(1, ...series);
  const bw = (w - padL - padR) / Math.max(n, 1);
  const y = (v) => padT + (height - padT - padB) * (1 - v / max);
  const mean = n ? series.reduce((a, b) => a + b, 0) / n : 0;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className="chart__grid" />
          <text x={padL - 6} y={y(t) + 4} className="chart__tick" textAnchor="end">{format(t)}{unit}</text>
        </g>
      ))}
      <line x1={padL} x2={w - padR} y1={y(mean)} y2={y(mean)} className="chart__mean" />
      {series.map((v, i) => (
        <rect key={i} x={padL + i * bw + 1} y={y(v)} width={Math.max(1, bw - 2)} height={height - padB - y(v)} className="chart__bar">
          <title>{labels[i]}: {format(v)}{unit}</title>
        </rect>
      ))}
      <text x={w - padR} y={height - 6} className="chart__tick" textAnchor="end">scenes in order →</text>
      <text x={padL} y={height - 6} className="chart__tick">mean {format(mean)}{unit}</text>
    </svg>
  );
};

const Pacing = () => {
  const { threads, snippets, byFile } = useProject();
  const [choice, setChoice] = useThreadChoice(threads);
  const thread = byFile.get(choice);
  const scenes = scenesOf(thread, snippets, byFile);
  const rows = scenes.map((s) => {
    const t = plain(s.content);
    const ss = sentences(t);
    const w = wordCount(t);
    return { s, words: w, dialogue: dialogueRatio(t), avgSentence: ss.length ? w / ss.length : 0, paragraphs: t.split(/\n+/).filter((p) => p.trim()).length };
  });
  const labels = rows.map((r, i) => `${i + 1}. ${r.s.name}`);
  const total = rows.reduce((n, r) => n + r.words, 0);
  const sorted = [...rows].sort((a, b) => b.words - a.words);
  const mean = rows.length ? total / rows.length : 0;
  const longRun = (() => {
    // longest stretch of consecutive scenes above 1.5× the mean
    let best = { len: 0, start: 0 }, cur = 0, start = 0;
    rows.forEach((r, i) => {
      if (r.words > mean * 1.5) { if (!cur) start = i; cur += 1; if (cur > best.len) best = { len: cur, start }; } else cur = 0;
    });
    return best;
  })();

  if (!rows.length) return <div className="analysis"><ThreadPicker threads={threads} value={choice} onChange={setChoice} /><p className="muted">No scenes to measure yet.</p></div>;

  return (
    <div className="analysis">
      <ThreadPicker threads={threads} value={choice} onChange={setChoice} />
      <div className="stats">
        <Stat label="scene length, mean" value={fmt(mean)} sub={`shortest ${fmt(sorted[sorted.length - 1].words)} · longest ${fmt(sorted[0].words)}`} />
        <Stat label="dialogue" value={pct(rows.reduce((n, r) => n + r.dialogue * r.words, 0) / Math.max(total, 1))} sub="of words inside quotation marks" />
        <Stat label="words per sentence" value={fmt(rows.reduce((n, r) => n + r.avgSentence * r.words, 0) / Math.max(total, 1), 1)} sub="weighted by scene length" />
        <Stat label="longest sag" value={longRun.len >= 2 ? `${longRun.len} scenes` : "none"} sub={longRun.len >= 2 ? `from scene ${longRun.start + 1}, all over 1.5× the mean` : "no run of over-long scenes in a row"} />
      </div>

      <h3>Scene length <small>words per scene — tall bars are where the book slows to dwell; a run of them is a sag</small></h3>
      <Chart series={rows.map((r) => r.words)} labels={labels} />

      <h3>Dialogue <small>share of each scene spoken aloud — flat stretches of narration read slower than talk</small></h3>
      <Chart series={rows.map((r) => r.dialogue * 100)} labels={labels} format={(v) => fmt(v)} unit="%" height={140} />

      <h3>Sentence rhythm <small>average words per sentence — long sentences slow the eye, short ones quicken it</small></h3>
      <Chart series={rows.map((r) => r.avgSentence)} labels={labels} format={(v) => fmt(v, 0)} height={140} />

      <h3>Outliers</h3>
      <div className="twoCol">
        <div>
          <h4>Longest scenes</h4>
          <ol className="plainList">{sorted.slice(0, 5).map((r) => <li key={r.s.file}><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link> <span className="muted">{fmt(r.words)} words</span></li>)}</ol>
        </div>
        <div>
          <h4>Shortest scenes</h4>
          <ol className="plainList">{sorted.slice(-5).reverse().map((r) => <li key={r.s.file}><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link> <span className="muted">{fmt(r.words)} words</span></li>)}</ol>
        </div>
      </div>
    </div>
  );
};

/* ── Style ────────────────────────────────────────────────────────────── */

const Style = () => {
  const { threads, snippets, byFile } = useProject();
  const [choice, setChoice] = useThreadChoice(threads);
  const thread = byFile.get(choice);
  const scenes = scenesOf(thread, snippets, byFile);
  const text = scenes.map((s) => plain(s.content)).join("\n\n");
  const st = useMemo(() => styleStats(text), [text]);
  const perScene = scenes.map((s) => ({ s, st: styleStats(plain(s.content)) })).filter((r) => r.st.words > 50);
  const by = (k, desc = true) => [...perScene].sort((a, b) => (desc ? b.st[k] - a.st[k] : a.st[k] - b.st[k])).slice(0, 5);

  if (!st.words) return <div className="analysis"><ThreadPicker threads={threads} value={choice} onChange={setChoice} /><p className="muted">No prose to measure yet.</p></div>;

  return (
    <div className="analysis">
      <ThreadPicker threads={threads} value={choice} onChange={setChoice} />
      <div className="stats">
        <Stat label="words per sentence" value={fmt(st.avgSentence, 1)} sub={`±${fmt(st.sdSentence, 1)} — ${st.sdSentence > st.avgSentence * 0.7 ? "varied rhythm" : "even rhythm"}`} />
        <Stat label="dialogue" value={pct(st.dialogue)} />
        <Stat label="reading grade" value={fmt(st.grade, 1)} sub="Flesch–Kincaid; most fiction sits 5–9" />
        <Stat label="vocabulary" value={pct(st.ttr)} sub="distinct words in the first 2,000" />
        <Stat label="-ly adverbs" value={fmt(st.adverbsPer1k, 1)} sub="per 1,000 words" />
        <Stat label="passive hints" value={fmt(st.passivePer1k, 1)} sub="“was/were + -ed” per 1,000" />
        <Stat label="exclamation marks" value={fmt(st.exclamPer1k, 1)} sub="per 1,000 words" />
        <Stat label="sentences" value={fmt(st.sentences)} sub={`${fmt(st.paragraphs)} paragraphs`} />
      </div>

      <div className="twoCol">
        <div>
          <h3>Filter and crutch words <small>how often each appears</small></h3>
          {st.filters.length ? (
            <table className="analysis__table compact">
              <tbody>{st.filters.slice(0, 14).map((f) => <tr key={f.word}><td>{f.word}</td><td className="num">{fmt(f.n)}</td><td className="num muted">{fmt((f.n / st.words) * 1000, 1)}‰</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">None found.</p>}
        </div>
        <div>
          <h3>Most used words <small>stop words removed</small></h3>
          <p className="cloud">{st.top.map(([w, n]) => <span key={w} style={{ fontSize: `${12 + Math.min(14, (n / st.top[0][1]) * 14)}px` }} title={`${n}×`}>{w}</span>)}</p>
        </div>
      </div>

      <h3>Longest sentence <small>{fmt(st.longestSentenceWords)} words</small></h3>
      <blockquote className="analysis__quote">{st.longestSentence}</blockquote>

      {perScene.length > 1 && (
        <>
          <h3>Scenes that stand out</h3>
          <div className="threeCol">
            <div><h4>Longest sentences</h4><ol className="plainList">{by("avgSentence").map((r) => <li key={r.s.file}><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link> <span className="muted">{fmt(r.st.avgSentence, 1)}</span></li>)}</ol></div>
            <div><h4>Most dialogue</h4><ol className="plainList">{by("dialogue").map((r) => <li key={r.s.file}><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link> <span className="muted">{pct(r.st.dialogue)}</span></li>)}</ol></div>
            <div><h4>Most adverbs</h4><ol className="plainList">{by("adverbsPer1k").map((r) => <li key={r.s.file}><Link to={"/elements/" + r.s.file}>{r.s.icon} {r.s.name}</Link> <span className="muted">{fmt(r.st.adverbsPer1k, 1)}‰</span></li>)}</ol></div>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Reader ───────────────────────────────────────────────────────────── */

const Stars = ({ n }) => <span className="stars" title={`${n} of 5`}>{"●".repeat(n)}<span>{"●".repeat(5 - n)}</span></span>;

/** Create or edit a reader profile. */
const ReaderForm = ({ initial, mode, onSave, onCancel, onDuplicate, onReset, onRemove, onHide, hasNotes }) => {
  const [f, setF] = useState(() => ({
    name: initial.name || "",
    icon: initial.icon || "🙂",
    persona: initial.persona || "",
    blurb: initial.blurb || "",
    profile: { ...EMPTY_PROFILE, ...(initial.profile || {}) },
  }));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setP = (k) => (e) => setF({ ...f, profile: { ...f.profile, [k]: e.target.type === "range" ? Number(e.target.value) : e.target.value } });
  const ok = f.name.trim() && f.persona.trim();
  const preview = personaText({ ...f });
  const PAT = ["gives up fast", "little patience", "average", "will stay for good writing", "savours slowness"];
  const STR = ["generous", "easy to please", "fair", "hard to impress", "severe"];

  return (
    <form className="readerForm" onSubmit={(e) => { e.preventDefault(); if (ok) onSave(f); }}>
      <div className="readerForm__row">
        <input type="text" value={f.icon} onChange={set("icon")} className="readerForm__icon" aria-label="Emoji" maxLength={4} />
        <input type="text" value={f.name} onChange={set("name")} placeholder="Reader’s name — “My agent”, “Book club”, “Mum”" aria-label="Name" />
      </div>
      <label className="readerForm__field">
        <span>Who they are <small>finish “You are …”</small></span>
        <textarea value={f.persona} onChange={set("persona")} rows={3} placeholder="a retired schoolteacher who reads two novels a week, mostly crime, and has no time for prologues" />
      </label>
      <div className="readerForm__grid">
        <label className="readerForm__field"><span>Mostly reads</span><input type="text" value={f.profile.reads} onChange={setP("reads")} placeholder="literary fiction, the occasional thriller" /></label>
        <label className="readerForm__field"><span>Cares most about</span><input type="text" value={f.profile.cares} onChange={setP("cares")} placeholder="characters I believe in, a voice I can hear" /></label>
        <label className="readerForm__field"><span>Loses them</span><input type="text" value={f.profile.loses} onChange={setP("loses")} placeholder="backstory dumps, more than three names a page" /></label>
        <label className="readerForm__field"><span>Hoping for</span><input type="text" value={f.profile.hopes} onChange={setP("hopes")} placeholder="to be frightened in a way that stays with me" /></label>
      </div>
      <div className="readerForm__grid">
        <label className="readerForm__field readerForm__range">
          <span>Patience <small>{PAT[f.profile.patience - 1]}</small></span>
          <input type="range" min={1} max={5} value={f.profile.patience} onChange={setP("patience")} />
        </label>
        <label className="readerForm__field readerForm__range">
          <span>Scoring <small>{STR[f.profile.strictness - 1]}</small></span>
          <input type="range" min={1} max={5} value={f.profile.strictness} onChange={setP("strictness")} />
        </label>
      </div>
      <label className="readerForm__field">
        <span>Short description <small>shown on the chip’s tooltip</small></span>
        <input type="text" value={f.blurb} onChange={set("blurb")} placeholder="(from the persona if blank)" />
      </label>
      <details className="readerForm__preview">
        <summary>What the model will be told</summary>
        <p>You are {preview}</p>
      </details>
      {hasNotes && <p className="readerForm__warn">This reader already has notes, taken under the previous profile. Re-read to refresh them.</p>}
      <div className="readerForm__row readerForm__actions">
        <button type="submit" className="primary" disabled={!ok}>{mode === "new" ? "Add reader" : "Save"}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
        <span className="spacer" />
        {mode === "edit" && onDuplicate && <button type="button" onClick={onDuplicate}>Duplicate</button>}
        {mode === "edit" && onReset && initial.edited && <button type="button" onClick={onReset}>Reset to default</button>}
        {mode === "edit" && onHide && <button type="button" onClick={onHide} title="Hide from this project; notes are kept">Hide</button>}
        {mode === "edit" && onRemove && <button type="button" onClick={onRemove}>Remove</button>}
      </div>
    </form>
  );
};

const Reader = () => {
  const { dir, threads, snippets, byFile } = useProject();
  const [choice, setChoice] = useThreadChoice(threads);
  const thread = byFile.get(choice);
  const scenes = scenesOf(thread, snippets, byFile);
  const [data, setData] = useState(() => loadReader(dir));
  const [readerId, setReaderId] = useState("first-time");
  const [form, setForm] = useState(null); // null | "new" | "edit"
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const abortRef = useRef(null);
  const configured = isConfigured();
  useEffect(() => { setData(loadReader(dir)); }, [dir]);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const readers = allReaders(data);
  const hiddenCount = READERS.length - readers.filter((r) => r.preset).length;
  const reader = readerById(readerId, data) || readers[0] || READERS[0];
  const mine = data.readers[reader.id] || { scenes: {}, overall: null };
  const reviewed = scenes.filter((s) => mine.scenes[s.file]).length;
  const pending = scenes.length - reviewed;

  const run = async (force) => {
    setErr(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy({ message: "Starting", pct: 0 });
    try {
      const out = await runReader(dir, scenes, {
        readerId: reader.id,
        force,
        signal: ctrl.signal,
        onProgress: ({ index, total, message }) => {
          setBusy({ message, pct: Math.round((index / Math.max(total, 1)) * 100) });
          setData(loadReader(dir));
        },
      });
      setData(out);
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
      setData(loadReader(dir));
    } finally {
      setBusy(null);
    }
  };

  const notesFor = (rid) => {
    const d = data.readers[rid];
    return d ? scenes.map((s) => ({ s, n: d.scenes[s.file] })).filter((x) => x.n) : [];
  };
  const notes = notesFor(reader.id);
  const avg = (ns) => (ns.length ? ns.reduce((a, x) => a + x.n.engagement, 0) / ns.length : 0);
  const dips = [...notes].sort((a, b) => a.n.engagement - b.n.engagement || a.n.clarity - b.n.clarity).slice(0, 5);
  const withNotes = readers.filter((r) => notesFor(r.id).length);

  return (
    <div className="analysis">
      <ThreadPicker threads={threads} value={choice} onChange={setChoice} />

      <div className="readers" role="tablist" aria-label="Readers">
        {readers.map((r) => {
          const has = notesFor(r.id).length;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === reader.id && !compare}
              className={"readerChip" + (r.id === reader.id && !compare ? " is-active" : "") + (has ? " has-notes" : "")}
              title={r.blurb}
              onClick={() => { setReaderId(r.id); setCompare(false); }}
            >
              <span>{r.icon}</span> {r.name}
              {has > 0 && <small>{has}</small>}
            </button>
          );
        })}
        <button type="button" className="readerChip readerChip--add" onClick={() => { setForm(form === "new" ? null : "new"); setCompare(false); }} title="Describe a reader of your own">+ Reader</button>
        {hiddenCount > 0 && <button type="button" className="readerChip readerChip--add" onClick={() => { unhideAll(dir); setData(loadReader(dir)); }} title="Show the hidden preset readers again">Show {hiddenCount} hidden</button>}
        {withNotes.length >= 2 && (
          <button type="button" className={"readerChip readerChip--compare" + (compare ? " is-active" : "")} onClick={() => setCompare((c) => !c)}>Compare {withNotes.length}</button>
        )}
      </div>
      {form === "new" && (
        <ReaderForm
          mode="new"
          initial={{}}
          onSave={(f) => { const id = addCustomReader(dir, f); setData(loadReader(dir)); setReaderId(id); setForm(null); setCompare(false); }}
          onCancel={() => setForm(null)}
        />
      )}
      {form === "edit" && !compare && (
        <ReaderForm
          key={reader.id}
          mode="edit"
          initial={reader}
          hasNotes={reviewed > 0}
          onSave={(f) => { updateReader(dir, reader.id, f); setData(loadReader(dir)); setForm(null); }}
          onCancel={() => setForm(null)}
          onDuplicate={() => { const id = duplicateReader(dir, reader.id); setData(loadReader(dir)); setReaderId(id); setForm("edit"); }}
          onReset={reader.preset ? () => { resetReader(dir, reader.id); setData(loadReader(dir)); setForm(null); } : undefined}
          onHide={reader.preset ? () => { hideReader(dir, reader.id); setData(loadReader(dir)); setReaderId("first-time"); setForm(null); } : undefined}
          onRemove={reader.custom ? () => { removeReader(dir, reader.id); setData(loadReader(dir)); setReaderId("first-time"); setForm(null); } : undefined}
        />
      )}

      {compare ? (
        <>
          <h3>Side by side <small>{withNotes.length} readers on {scenes.length} scenes</small></h3>
          <table className="analysis__table">
            <thead><tr><th>Reader</th><th className="num">Scenes read</th><th className="num">Engagement</th><th className="num">Clarity</th><th className="num">Felt slow</th><th className="num">Questions</th><th>Verdict</th></tr></thead>
            <tbody>
              {withNotes.map((r) => {
                const ns = notesFor(r.id);
                const ov = data.readers[r.id].overall;
                return (
                  <tr key={r.id}>
                    <td><button type="button" className="linkish" onClick={() => { setReaderId(r.id); setCompare(false); }}>{r.icon} {r.name}</button></td>
                    <td className="num">{ns.length}</td>
                    <td className="num">{fmt(avg(ns), 1)}</td>
                    <td className="num">{fmt(ns.reduce((a, x) => a + x.n.clarity, 0) / ns.length, 1)}</td>
                    <td className="num">{ns.filter((x) => x.n.pace === "slow").length}</td>
                    <td className="num">{ns.reduce((a, x) => a + x.n.questions.length, 0)}</td>
                    <td className="muted">{ov ? (ov.wouldRecommend ? "would recommend" : "would not, yet") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3>Engagement by scene <small>one line per reader</small></h3>
          <MultiLine
            series={withNotes.map((r) => ({ name: `${r.icon} ${r.name}`, values: scenes.map((s) => (data.readers[r.id].scenes[s.file] || {}).engagement || null) }))}
            labels={scenes.map((s, i) => `${i + 1}. ${s.name}`)}
          />

          <h3>Where readers disagree <small>scenes with the widest spread of engagement</small></h3>
          <ol className="plainList">
            {scenes
              .map((s) => {
                const vals = withNotes.map((r) => ({ r, v: (data.readers[r.id].scenes[s.file] || {}).engagement })).filter((x) => x.v);
                if (vals.length < 2) return null;
                const hi = vals.reduce((a, b) => (b.v > a.v ? b : a));
                const lo = vals.reduce((a, b) => (b.v < a.v ? b : a));
                return { s, spread: hi.v - lo.v, hi, lo };
              })
              .filter((x) => x && x.spread >= 2)
              .sort((a, b) => b.spread - a.spread)
              .slice(0, 6)
              .map((x) => (
                <li key={x.s.file}>
                  <Link to={"/elements/" + x.s.file}>{x.s.icon} {x.s.name}</Link>{" "}
                  <span className="muted">{x.hi.r.icon} {x.hi.v}/5 vs {x.lo.r.icon} {x.lo.v}/5</span>
                </li>
              ))}
          </ol>

          <h3>Verdicts</h3>
          <div className="verdicts">
            {withNotes.filter((r) => data.readers[r.id].overall).map((r) => (
              <article key={r.id} className="note">
                <header><span>{r.icon} {r.name}</span><span className="note__meta">{data.readers[r.id].overall.wouldRecommend ? "would recommend" : "would not recommend yet"}</span></header>
                <p>{data.readers[r.id].overall.verdict}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="readerIntro">
            <span className="readerIntro__icon">{reader.icon}</span> <b>{reader.name}</b>{reader.edited && <span className="readerIntro__tag">edited</span>}{reader.custom && <span className="readerIntro__tag">yours</span>} — {personaText(reader)}
            {form !== "edit" && <button type="button" className="linkish readerIntro__edit" onClick={() => setForm("edit")}>Edit profile</button>}
          </p>
          <div className="reader__bar">
            {!configured && <span className="muted">Connect Spinner (the <Link to="/spinner/settings">Spinner</Link> tab, or the button on the project tray) to run a reader.</span>}
            {configured && !busy && (
              <>
                <button type="button" className="primary" onClick={() => run(false)} disabled={!pending}>
                  {pending ? `Read ${pending} unread scene${pending === 1 ? "" : "s"}` : "All scenes read"}
                </button>
                {reviewed > 0 && <button type="button" onClick={() => run(true)}>Re-read everything</button>}
                {reviewed > 0 && <button type="button" onClick={() => { clearReader(dir, reader.id); setData(loadReader(dir)); }}>Forget notes</button>}
                <span className="muted">One call per scene, then one for the whole.</span>
              </>
            )}
            {busy && (
              <>
                <span>{busy.message}…</span>
                <div className="bar"><i style={{ width: `${busy.pct}%` }} /></div>
                <button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button>
              </>
            )}
            {err && <span className="err">{err}</span>}
          </div>

          {mine.overall && (
            <section className="letter">
              <h3>After finishing <small>{mine.overall.scenes} scenes · {mine.overall.wouldRecommend ? "would recommend" : "would not recommend yet"}</small></h3>
              <p>{mine.overall.verdict}</p>
              <div className="twoCol">
                <div><h4>What worked</h4><ul>{mine.overall.strongest.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                <div><h4>What held it back</h4><ul>{mine.overall.weakest.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              </div>
              <h4>Pacing</h4><p>{mine.overall.pacing}</p>
              {mine.overall.threads.length > 0 && <><h4>Dropped or under-served</h4><ul>{mine.overall.threads.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
            </section>
          )}

          {notes.length > 0 && (
            <>
              <div className="stats">
                <Stat label="engagement, mean" value={fmt(avg(notes), 1) + " / 5"} sub={`${notes.length} scene${notes.length === 1 ? "" : "s"} read`} />
                <Stat label="felt slow" value={fmt(notes.filter((x) => x.n.pace === "slow").length)} sub="scenes" />
                <Stat label="felt rushed" value={fmt(notes.filter((x) => x.n.pace === "rushed").length)} sub="scenes" />
                <Stat label="open questions" value={fmt(notes.reduce((a, x) => a + x.n.questions.length, 0))} sub="things this reader was left wondering" />
              </div>
              <h3>Engagement, scene by scene</h3>
              <Chart series={notes.map((x) => x.n.engagement)} labels={notes.map((x, i) => `${i + 1}. ${x.s.name}`)} format={(v) => fmt(v, 0)} height={120} max={5} />
              {dips.length > 0 && (
                <>
                  <h3>Where attention dipped</h3>
                  <ol className="plainList">{dips.map((x) => <li key={x.s.file}><Link to={"/elements/" + x.s.file}>{x.s.icon} {x.s.name}</Link> <Stars n={x.n.engagement} /> <span className="muted">{x.n.pace}</span></li>)}</ol>
                </>
              )}
              <h3>Notes</h3>
              <div className="notes">
                {notes.map((x, i) => (
                  <article key={x.s.file} className="note">
                    <header>
                      <Link to={"/elements/" + x.s.file}><span className="muted">{i + 1}.</span> {x.s.icon} {x.s.name}</Link>
                      <span className="note__meta"><Stars n={x.n.engagement} /> engagement · <Stars n={x.n.clarity} /> clarity · {x.n.pace}</span>
                    </header>
                    <p>{x.n.reaction}</p>
                    {x.n.questions.length > 0 && <ul className="note__q">{x.n.questions.map((q, j) => <li key={j}>{q}</li>)}</ul>}
                    {x.n.memorable && <p className="note__mem">“{x.n.memorable}”</p>}
                  </article>
                ))}
              </div>
            </>
          )}
          {!notes.length && !busy && configured && <p className="muted">{reader.name} hasn’t read anything yet.</p>}
        </>
      )}
    </div>
  );
};

/** Several readers' engagement over the same scenes, as lines. */
const MultiLine = ({ series, labels, height = 180 }) => {
  const w = 900, padL = 30, padR = 12, padT = 12, padB = 24;
  const n = labels.length;
  const x = (i) => padL + ((w - padL - padR) * (n > 1 ? i / (n - 1) : 0.5));
  const y = (v) => padT + (height - padT - padB) * (1 - (v - 1) / 4);
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" role="img">
        {[1, 2, 3, 4, 5].map((t) => (
          <g key={t}><line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className="chart__grid" /><text x={padL - 6} y={y(t) + 4} className="chart__tick" textAnchor="end">{t}</text></g>
        ))}
        {series.map((s, k) => {
          const pts = s.values.map((v, i) => (v ? `${x(i)},${y(v)}` : null));
          const segs = []; let cur = [];
          pts.forEach((p) => { if (p) cur.push(p); else { if (cur.length) segs.push(cur); cur = []; } });
          if (cur.length) segs.push(cur);
          return segs.map((seg, j) => <polyline key={k + "-" + j} points={seg.join(" ")} className={"chart__line chart__line--" + (k % 6)} />);
        })}
        <text x={w - padR} y={height - 6} className="chart__tick" textAnchor="end">scenes in order →</text>
      </svg>
      <p className="legend">{series.map((s, k) => <span key={k}><i className={"chart__swatch chart__line--" + (k % 6)} /> {s.name}</span>)}</p>
    </div>
  );
};

/* ── AI influence ─────────────────────────────────────────────────────── */

const Influence = () => {
  const [tick, setTick] = useState(0);
  const { dir, actors, snippets, byFile } = useProject(tick);
  const [showAi, setShow] = useState(getShowAi());
  const data = useMemo(() => loadProvenance(dir), [dir, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const refresh = () => setTick((t) => t + 1);

  const rows = data.insertions.map((ins) => {
    const s = byFile.get(ins.file);
    const st = s ? insertionStatus(s.content, ins) : { status: "removed", similarity: 0, words: 0 };
    return { ins, s, ...st };
  });
  const byScene = new Map();
  rows.forEach((r) => { const k = r.ins.file; if (!byScene.has(k)) byScene.set(k, []); byScene.get(k).push(r); });
  const sceneTotals = snippets.map((s) => ({ s, ...aiWords(s.content) })).filter((x) => x.ai > 0);
  const totalAi = sceneTotals.reduce((n, x) => n + x.ai, 0);
  const totalWords = snippets.reduce((n, x) => n + aiWords(x.content).total, 0);
  const live = rows.filter((r) => r.status === "verbatim" || r.status === "edited");
  const aiActors = actors.filter((a) => a.origin && a.origin !== "author");

  const act = (fn, file, id) => {
    const s = loadFile(dir + file);
    if (!s) return;
    s.content = fn(s.content, id);
    saveFile(dir + s.file, s);
    refresh();
  };
  const removeOne = (file, id) => act(removeFromHtml, file, id);
  const unmarkOne = (file, id) => act(unmarkInHtml, file, id);
  const removeScene = (file) => act(removeFromHtml, file, null);
  const unmarkScene = (file) => act(unmarkInHtml, file, null);
  const removeAll = () => { snippets.forEach((s) => { if (aiWords(s.content).ai) act(removeFromHtml, s.file, null); }); };
  const unmarkAll = () => { snippets.forEach((s) => { if (aiWords(s.content).ai) act(unmarkInHtml, s.file, null); }); };
  const toggleShow = () => { setShowAi(!showAi); setShow(!showAi); };

  return (
    <div className="analysis">
      <div className="stats">
        <Stat label="words traced to Spinner" value={fmt(totalAi)} sub={totalWords ? `${pct(totalAi / totalWords)} of ${fmt(totalWords)} words in scenes` : "no scenes yet"} />
        <Stat label="insertions still present" value={fmt(live.length)} sub={`${rows.filter((r) => r.status === "verbatim").length} verbatim · ${rows.filter((r) => r.status === "edited").length} rewritten`} />
        <Stat label="insertions removed" value={fmt(rows.filter((r) => r.status === "removed").length)} sub={`${rows.filter((r) => r.status === "unmarked").length} un-marked (text kept)`} />
        <Stat label="actors Spinner made" value={fmt(aiActors.length)} sub="facts and elements from import or scans" />
      </div>

      <div className="reader__bar" style={{ marginTop: 14 }}>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={showAi} onChange={toggleShow} /> Underline AI text in the editor</label>
        <span className="spacer" style={{ flex: 1 }} />
        {totalAi > 0 && <button type="button" onClick={unmarkAll} title="Keep every word, drop the markers everywhere">Un-mark all</button>}
        {totalAi > 0 && <button type="button" onClick={() => { if (window.confirm(`Remove ${fmt(totalAi)} words of Spinner's prose from ${sceneTotals.length} scene${sceneTotals.length === 1 ? "" : "s"}? This cannot be undone.`)) removeAll(); }} className="danger">Remove all AI text</button>}
      </div>

      <h3>By scene <small>how much of each scene's wording still traces to Spinner, including passages you have since rewritten</small></h3>
      {sceneTotals.length === 0 && <p className="muted">No scene contains Spinner's prose{data.insertions.length ? " any more" : ""}.</p>}
      {sceneTotals.length > 0 && (
        <table className="analysis__table">
          <thead><tr><th>Scene</th><th className="num">AI words</th><th className="num">Of scene</th><th className="bar"></th><th></th></tr></thead>
          <tbody>
            {sceneTotals.sort((a, b) => b.ai / b.total - a.ai / a.total).map((x) => (
              <tr key={x.s.file}>
                <td><Link to={"/elements/" + x.s.file}>{x.s.icon} {x.s.name}</Link></td>
                <td className="num">{fmt(x.ai)}</td>
                <td className="num">{pct(x.ai / Math.max(x.total, 1))}</td>
                <td className="bar"><i style={{ width: `${Math.min(100, (x.ai / Math.max(x.total, 1)) * 100)}%` }} /></td>
                <td className="num"><button type="button" onClick={() => unmarkScene(x.s.file)}>Un-mark</button> <button type="button" onClick={() => removeScene(x.s.file)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Every insertion <small>what Spinner wrote, when, and what became of it</small></h3>
      {rows.length === 0 && <p className="muted">Nothing has been inserted from Spinner yet. Ideas you insert from a scene’s “Ask Spinner for ideas” panel are logged here.</p>}
      <div className="notes">
        {[...byScene.entries()].map(([file, list]) => {
          const s = byFile.get(file);
          return (
            <div key={file}>
              <h4>{s ? <Link to={"/elements/" + s.file}>{s.icon} {s.name}</Link> : <span className="muted">deleted scene</span>}</h4>
              {list.sort((a, b) => b.ins.at - a.ins.at).map((r) => (
                <article key={r.ins.id} className={"note insertion is-" + r.status}>
                  <header>
                    <span><span className={"tag tag--" + r.status}>{r.status === "verbatim" ? "verbatim" : r.status === "edited" ? `rewritten · ${pct(r.similarity)} original` : r.status === "unmarked" ? "un-marked, text kept" : "removed"}</span> <span className="muted">{new Date(r.ins.at).toLocaleString()} · {r.ins.kind === "revise" || r.ins.kind === "talk-revise" ? "woven in" : r.ins.kind}{r.ins.model ? ` · ${r.ins.model}` : ""} · {r.ins.words} words{r.ins.removed ? ` · ${r.ins.removed} of yours dropped` : ""}</span></span>
                    {(r.status === "verbatim" || r.status === "edited") && s && (
                      <span className="note__meta">
                        <button type="button" onClick={() => unmarkOne(file, r.ins.id)} title="Keep the words, drop the mark">Un-mark</button>{" "}
                        <button type="button" onClick={() => removeOne(file, r.ins.id)} title="Delete this passage from the scene">Remove</button>
                      </span>
                    )}
                  </header>
                  <p className="insertion__text">{r.status === "edited" && r.now ? r.now : r.ins.text}</p>
                  {r.status === "edited" && <details className="insertion__orig"><summary>As Spinner wrote it</summary><p>{r.ins.text}</p></details>}
                  {r.ins.prompt && <p className="muted">Asked: “{r.ins.prompt}”</p>}
                </article>
              ))}
            </div>
          );
        })}
      </div>

      {aiActors.length > 0 && (
        <>
          <h3>Actors Spinner created <small>facts and elements from the manuscript import or link scans — the model's reading, not its prose</small></h3>
          <ul className="plainList">
            {aiActors.slice(0, 200).map((a) => <li key={a.file}><Link to={"/elements/" + a.file}>{a.icon} {a.name}</Link> <span className="muted">{a.type} · {a.origin}</span></li>)}
            {aiActors.length > 200 && <li className="muted">…and {fmt(aiActors.length - 200)} more</li>}
          </ul>
        </>
      )}
    </div>
  );
};

/* ── shell ────────────────────────────────────────────────────────────── */

const VIEWS = { wordcount: WordCount, pacing: Pacing, style: Style, reader: Reader, influence: Influence };

const Analysis = () => {
  const { id } = useParams();
  const meta = analysisById(id);
  const View = VIEWS[id];
  if (!meta || !View) return <div className="workspace"><span>No such analysis.</span></div>;
  const Icon = meta.icon;
  return (
    <div className="workspace analysisView">
      <h1 className="workspaceHeader">
        <span className="typeIcon"><Icon /></span>
        <p>{meta.name}</p>
        <span className="workspaceHeader__blurb">{meta.blurb}</span>
      </h1>
      <View />
    </div>
  );
};

export default Analysis;
