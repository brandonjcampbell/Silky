import React, { useEffect, useRef, useState } from "react";
import Modal from "../Modal/Modal";
import { isConfigured } from "../../llm/config";
import { splitManuscript, extractModel, writeProject, uniqueProjectName } from "../../llm/extract";

const stripExt = (n) => n.replace(/\.[^.]+$/, "");
const wc = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/**
 * Paste or drop a manuscript → preview the scene split → (optionally) have the
 * model extract elements and facts → write a new project.
 */
const ImportManuscript = ({ onClose, onDone, onOpenSettings }) => {
  const [step, setStep] = useState("input"); // input | preview | working | done
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [scenes, setScenes] = useState([]);
  const [progress, setProgress] = useState({ message: "", pct: 0 });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [over, setOver] = useState(false);
  const abortRef = useRef(null);
  const configured = isConfigured();

  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ""));
      if (!name) setName(stripExt(file.name));
    };
    reader.readAsText(file);
  };

  const toPreview = () => {
    const s = splitManuscript(text);
    setScenes(s);
    setStep("preview");
  };

  const run = async (withModel) => {
    const project = uniqueProjectName(name.trim() || "Imported manuscript");
    setError(null);
    setStep("working");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let model = null;
      if (withModel) {
        model = await extractModel(scenes, {
          signal: ctrl.signal,
          onProgress: ({ step: st, index, total, message }) => {
            const pct = st === "scenes" ? Math.round((index / total) * 90) : 95;
            setProgress({ message, pct });
          },
        });
      }
      setProgress({ message: "Writing project", pct: 98 });
      writeProject(project, scenes, model);
      setResult({
        project,
        scenes: scenes.length,
        elements: model ? model.elements.length : 0,
        facts: model ? model.facts.length : 0,
        links: model ? model.links.length : 0,
        failed: model ? model.scenes.filter((s) => s.error).length : 0,
      });
      setStep("done");
    } catch (e) {
      if (e && e.name === "AbortError") {
        setStep("preview");
        return;
      }
      setError(e.message || String(e));
      setStep("preview");
    }
  };

  const cancel = () => abortRef.current && abortRef.current.abort();

  const totalWords = scenes.reduce((n, s) => n + s.words, 0);

  /* ── footers per step ── */
  let footer = null;
  if (step === "input") {
    footer = (
      <>
        <span className="status" style={{ color: "var(--ink-muted)" }}>{wc(text) ? `${wc(text).toLocaleString()} words` : ""}</span>
        <span className="spacer" />
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="button" className="primary" onClick={toPreview} disabled={!text.trim()}>Next</button>
      </>
    );
  } else if (step === "preview") {
    footer = (
      <>
        <button type="button" onClick={() => setStep("input")}>Back</button>
        <span className="spacer" />
        {error && <span className="status err">{error}</span>}
        <button type="button" onClick={() => run(false)}>Scenes only</button>
        {configured ? (
          <button type="button" className="primary" onClick={() => run(true)} disabled={!scenes.length}>
            Extract with model
          </button>
        ) : (
          <button type="button" onClick={onOpenSettings}>Connect a model…</button>
        )}
      </>
    );
  } else if (step === "working") {
    footer = (
      <>
        <span className="spacer" />
        <button type="button" onClick={cancel}>Cancel</button>
      </>
    );
  } else if (step === "done") {
    footer = (
      <>
        <span className="spacer" />
        <button type="button" onClick={onClose}>Close</button>
        <button type="button" className="primary" onClick={() => onDone(result.project)}>Open project</button>
      </>
    );
  }

  return (
    <Modal title="Import a manuscript" onClose={step === "working" ? undefined : onClose} footer={footer} wide>
      {step === "input" && (
        <>
          <p className="note">
            Paste the text or drop a <code>.txt</code> / <code>.md</code> file. Silky splits it into scenes at
            headings and scene breaks (<code>* * *</code>, <code>---</code>, “Chapter …”), then a connected
            model can draft the elements and facts each scene establishes.
          </p>
          <div
            className={"dropzone" + (over ? " is-over" : "")}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files[0]); }}
          >
            Drop a file here, or
            <label className="pick">
              choose one
              <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" onChange={(e) => readFile(e.target.files[0])} />
            </label>
          </div>
          <label className="field">
            <span>Project name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Imported manuscript" />
          </label>
          <label className="field">
            <span>Manuscript</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the manuscript here." spellCheck={false} />
          </label>
        </>
      )}

      {step === "preview" && (
        <>
          <p className="note">
            {scenes.length} scene{scenes.length === 1 ? "" : "s"}, {totalWords.toLocaleString()} words.
            {configured
              ? " Each scene is sent to the model once, then one pass links causes to effects."
              : " No model is connected yet, so only the scenes can be imported."}
          </p>
          <ol className="sceneList">
            {scenes.map((s, i) => (
              <li key={i}>
                <span className="n">{i + 1}</span>
                <span className="t">{s.title || s.text.slice(0, 90).replace(/\s+/g, " ")}</span>
                <span className="w">{s.words.toLocaleString()} w</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {step === "working" && (
        <>
          <p className="note">{progress.message || "Starting"}…</p>
          <div className="bar"><i style={{ width: `${progress.pct}%` }} /></div>
          <p className="hint">Leave this open. Cancelling keeps nothing.</p>
        </>
      )}

      {step === "done" && result && (
        <>
          <p className="note">Written to <b>{result.project}</b>.</p>
          <div className="summaryGrid">
            <div><b>{result.scenes}</b><span>scenes</span></div>
            <div><b>{result.elements}</b><span>elements</span></div>
            <div><b>{result.facts}</b><span>facts</span></div>
            <div><b>{result.links}</b><span>causal links</span></div>
          </div>
          {result.failed > 0 && (
            <p className="hint">{result.failed} scene{result.failed === 1 ? "" : "s"} couldn’t be read by the model and were imported as text only.</p>
          )}
          <p className="hint">Everything is a draft: the whole web is in a web called “{result.project} — whole web”, and the scenes run in order in the “Manuscript” thread.</p>
        </>
      )}
    </Modal>
  );
};

export default ImportManuscript;
