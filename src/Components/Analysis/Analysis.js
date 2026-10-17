import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaChartBar, FaTachometerAlt, FaFeatherAlt, FaBookReader } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { plain, wordCount, styleStats, dialogueRatio, sentences, fmt, pct } from "../../analysis/text";
import { loadReader, runReader, clearReader } from "../../analysis/reader";
import { isConfigured } from "../../llm/config";
import "./Analysis.css";

export const ANALYSES = [
  { id: "wordcount", name: "Word count", icon: FaChartBar, blurb: "Totals, and every scene and thread measured." },
  { id: "pacing", name: "Pacing", icon: FaTachometerAlt, blurb: "Scene lengths, dialogue and sentence rhythm across the book." },
  { id: "style", name: "Style", icon: FaFeatherAlt, blurb: "Sentence length, dialogue, adverbs, filter words, vocabulary." },
  { id: "reader", name: "Reader", icon: FaBookReader, blurb: "A model reads it cold and tells you how it landed." },
];

export const analysisById = (id) => ANALYSES.find((a) => a.id === id);

/* ── data helpers ─────────────────────────────────────────────────────── */

const useProject = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const actors = useMemo(
    () => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir, state.project]
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

const Reader = () => {
  const { dir, threads, snippets, byFile } = useProject();
  const [choice, setChoice] = useThreadChoice(threads);
  const thread = byFile.get(choice);
  const scenes = scenesOf(thread, snippets, byFile);
  const [data, setData] = useState(() => loadReader(dir));
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const abortRef = useRef(null);
  const configured = isConfigured();
  useEffect(() => { setData(loadReader(dir)); }, [dir]);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const reviewed = scenes.filter((s) => data.scenes[s.file]).length;
  const pending = scenes.length - reviewed;

  const run = async (force) => {
    setErr(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy({ message: "Starting", pct: 0 });
    try {
      const out = await runReader(dir, scenes, {
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

  const notes = scenes.map((s) => ({ s, n: data.scenes[s.file] })).filter((x) => x.n);
  const avgEng = notes.length ? notes.reduce((a, x) => a + x.n.engagement, 0) / notes.length : 0;
  const dips = [...notes].sort((a, b) => a.n.engagement - b.n.engagement || a.n.clarity - b.n.clarity).slice(0, 5);

  return (
    <div className="analysis">
      <ThreadPicker threads={threads} value={choice} onChange={setChoice} />
      <div className="reader__bar">
        {!configured && <span className="muted">Connect a model (the <b>Model</b> button on the project tray) to run a reader.</span>}
        {configured && !busy && (
          <>
            <button type="button" className="primary" onClick={() => run(false)} disabled={!pending}>
              {pending ? `Read ${pending} unread scene${pending === 1 ? "" : "s"}` : "All scenes read"}
            </button>
            {reviewed > 0 && <button type="button" onClick={() => run(true)}>Re-read everything</button>}
            {reviewed > 0 && <button type="button" onClick={() => { clearReader(dir); setData(loadReader(dir)); }}>Forget notes</button>}
            <span className="muted">One call per scene, then one for the whole. Notes are saved in the project.</span>
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

      {data.overall && (
        <section className="letter">
          <h3>After finishing <small>{data.overall.scenes} scenes · {data.overall.wouldRecommend ? "would recommend" : "would not recommend yet"}</small></h3>
          <p>{data.overall.verdict}</p>
          <div className="twoCol">
            <div><h4>What worked</h4><ul>{data.overall.strongest.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            <div><h4>What held it back</h4><ul>{data.overall.weakest.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          </div>
          <h4>Pacing</h4><p>{data.overall.pacing}</p>
          {data.overall.threads.length > 0 && <><h4>Dropped or under-served</h4><ul>{data.overall.threads.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
        </section>
      )}

      {notes.length > 0 && (
        <>
          <div className="stats">
            <Stat label="engagement, mean" value={fmt(avgEng, 1) + " / 5"} sub={`${notes.length} scene${notes.length === 1 ? "" : "s"} read`} />
            <Stat label="felt slow" value={fmt(notes.filter((x) => x.n.pace === "slow").length)} sub="scenes" />
            <Stat label="felt rushed" value={fmt(notes.filter((x) => x.n.pace === "rushed").length)} sub="scenes" />
            <Stat label="open questions" value={fmt(notes.reduce((a, x) => a + x.n.questions.length, 0))} sub="things the reader was left wondering" />
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
      {!notes.length && !busy && configured && <p className="muted">Nothing read yet.</p>}
    </div>
  );
};

/* ── shell ────────────────────────────────────────────────────────────── */

const VIEWS = { wordcount: WordCount, pacing: Pacing, style: Style, reader: Reader };

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
