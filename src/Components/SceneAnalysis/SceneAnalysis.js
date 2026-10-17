import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartLine } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { plain, styleStats, fmt, pct } from "../../analysis/text";
import { loadReader, allReaders } from "../../analysis/reader";
import "./SceneAnalysis.css";

const Stars = ({ n }) => <span className="stars" title={`${n} of 5`}>{"●".repeat(n)}<span>{"●".repeat(5 - n)}</span></span>;

/** "longer than most", "about average", … from this scene's value vs the project's. */
const compare = (v, ref, { higher = "more", lower = "less", unit = "" } = {}) => {
  if (!ref || !Number.isFinite(v)) return null;
  const r = v / ref;
  if (r > 1.6) return { tone: "hi", text: `far ${higher} than most scenes` };
  if (r > 1.2) return { tone: "hi", text: `${higher} than most scenes` };
  if (r < 0.4) return { tone: "lo", text: `far ${lower} than most scenes` };
  if (r < 0.8) return { tone: "lo", text: `${lower} than most scenes` };
  return { tone: "mid", text: "about average for this project" + unit };
};

const Measure = ({ label, value, note }) => (
  <div className={"measure" + (note ? " is-" + note.tone : "")}>
    <b>{value}</b>
    <span>{label}</span>
    {note && <small>{note.text}</small>}
  </div>
);

/**
 * What the analyses know about one scene: its own measures against the
 * project's, and every reader's notes on it. Shown inside the snippet view.
 */
const SceneAnalysis = ({ element }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem("silky:sceneAnalysis") !== "closed"; } catch (e) { return true; }
  });
  const toggle = () => {
    setOpen((o) => {
      try { localStorage.setItem("silky:sceneAnalysis", o ? "closed" : "open"); } catch (e) { /* ignore */ }
      return !o;
    });
  };

  const text = plain(element.content);
  const mine = useMemo(() => styleStats(text), [text]);

  // project baseline: means over every other scene with real prose
  const baseline = useMemo(() => {
    const scenes = loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter((a) => a && a.type === "snippet" && a.file !== element.file);
    const stats = scenes.map((s) => styleStats(plain(s.content))).filter((s) => s.words > 50);
    if (!stats.length) return null;
    const mean = (k) => stats.reduce((n, s) => n + s[k], 0) / stats.length;
    return { n: stats.length, words: mean("words"), avgSentence: mean("avgSentence"), dialogue: mean("dialogue"), adverbsPer1k: mean("adverbsPer1k"), grade: mean("grade") };
    // other scenes don't change while this one is being edited, so the
    // baseline is keyed on the scene alone, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, element.file]);

  const readerData = useMemo(() => loadReader(dir), [dir, element.file, text.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const notes = allReaders(readerData)
    .map((r) => ({ r, n: readerData.readers[r.id] && readerData.readers[r.id].scenes[element.file] }))
    .filter((x) => x.n);

  if (!mine.words && !notes.length) return null;

  const filters = mine.filters.slice(0, 6);

  return (
    <section className={"sceneAnalysis" + (open ? "" : " is-closed")}>
      <button type="button" className="sceneAnalysis__head" onClick={toggle} aria-expanded={open}>
        <FaChartLine />
        <span>Analysis</span>
        <span className="sceneAnalysis__summary">
          {fmt(mine.words)} words · {pct(mine.dialogue)} dialogue
          {notes.length > 0 && ` · ${notes.length} reader${notes.length === 1 ? "" : "s"}`}
        </span>
        <span className="sceneAnalysis__chev">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="sceneAnalysis__body">
          {mine.words > 0 && (
            <>
              <div className="measures">
                <Measure label="words" value={fmt(mine.words)} note={compare(mine.words, baseline && baseline.words, { higher: "longer", lower: "shorter" })} />
                <Measure label="words per sentence" value={fmt(mine.avgSentence, 1)} note={compare(mine.avgSentence, baseline && baseline.avgSentence, { higher: "longer sentences", lower: "shorter sentences" })} />
                <Measure label="dialogue" value={pct(mine.dialogue)} note={compare(mine.dialogue, baseline && baseline.dialogue, { higher: "talkier", lower: "quieter" })} />
                <Measure label="-ly adverbs ‰" value={fmt(mine.adverbsPer1k, 1)} note={compare(mine.adverbsPer1k, baseline && baseline.adverbsPer1k)} />
                <Measure label="reading grade" value={fmt(mine.grade, 1)} note={compare(mine.grade, baseline && baseline.grade, { higher: "denser", lower: "plainer" })} />
                <Measure label="to read" value={`${fmt(Math.max(1, mine.readingMinutes))} min`} />
              </div>
              {(filters.length > 0 || mine.longestSentenceWords > 40) && (
                <div className="sceneAnalysis__row">
                  {filters.length > 0 && (
                    <p className="sceneAnalysis__filters">
                      <span className="muted">Crutch words:</span> {filters.map((f) => <span key={f.word} className="pill">{f.word} <b>{f.n}</b></span>)}
                    </p>
                  )}
                  {mine.longestSentenceWords > 40 && (
                    <p className="sceneAnalysis__long"><span className="muted">Longest sentence, {mine.longestSentenceWords} words:</span> “{mine.longestSentence}”</p>
                  )}
                </div>
              )}
            </>
          )}

          {notes.length > 0 && (
            <div className="sceneNotes">
              {notes.map(({ r, n }) => (
                <article key={r.id} className="sceneNote">
                  <header>
                    <span className="sceneNote__who">{r.icon} {r.name}</span>
                    <span className="sceneNote__meta"><Stars n={n.engagement} /> engagement · <Stars n={n.clarity} /> clarity · {n.pace}</span>
                  </header>
                  <p>{n.reaction}</p>
                  {n.questions.length > 0 && <ul>{n.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>}
                  {n.memorable && <p className="sceneNote__mem">“{n.memorable}”</p>}
                </article>
              ))}
            </div>
          )}

          <p className="sceneAnalysis__foot">
            <Link to="/analysis/pacing">Pacing</Link> · <Link to="/analysis/style">Style</Link> · <Link to="/analysis/reader">Readers</Link>
            {baseline && <span className="muted"> — compared with {fmt(baseline.n)} other scene{baseline.n === 1 ? "" : "s"}</span>}
          </p>
        </div>
      )}
    </section>
  );
};

export default SceneAnalysis;
