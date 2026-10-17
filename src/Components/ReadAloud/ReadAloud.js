import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaVolumeUp, FaPlay, FaPause, FaStop, FaStepBackward, FaStepForward } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadFile } from "../../utils/";
import { Reader, unitsFor, getVoices, supported, loadPrefs, savePrefs } from "../../speech";
import "./ReadAloud.css";

/**
 * Read a scene (or a whole thread) aloud with the browser's voices. One
 * button in the header; a player bar while it runs that shows the sentence
 * being spoken and lets you jump.
 */
const ReadAloud = ({ element }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState({ playing: false, paused: false, i: 0, n: 0, unit: null });
  const [voices, setVoices] = useState([]);
  const [prefs, setPrefs] = useState(loadPrefs);
  const reader = useRef(null);
  if (!reader.current) reader.current = new Reader({ onState: setSt });
  // the button lives in the header's tool slot, the player below the header
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    const find = () => setSlot(document.querySelector(".workspace .workspaceHeader [data-tools-slot]"));
    find();
    const t = setTimeout(find, 50);
    return () => clearTimeout(t);
  }, [element.file]);

  const scenes = useMemo(() => {
    if (element.type === "thread") return (element.sequences || []).map((f) => loadFile(dir + f)).filter((a) => a && a.type === "snippet");
    return typeof element.content === "string" ? [element] : [];
  }, [element, dir]);
  const units = useMemo(() => unitsFor(scenes), [scenes]);

  useEffect(() => {
    getVoices().then((v) => {
      const en = v.filter((x) => /^en/i.test(x.lang));
      const list = en.length ? en : v;
      setVoices(list);
      const pick = list.find((x) => x.voiceURI === prefs.voice) || list.find((x) => x.default) || list[0];
      if (pick) reader.current.setVoice(pick);
    });
    reader.current.rate = prefs.rate;
    reader.current.pitch = prefs.pitch;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stop when the actor changes or the panel unmounts
  useEffect(() => { reader.current.load(units, 0); }, [units]);
  useEffect(() => () => reader.current.stop(), []);

  if (!supported() || !units.length) return null;

  /** Start from the caret's sentence if it sits in this scene's editor. */
  const startIndex = () => {
    const sel = window.getSelection();
    const page = document.querySelector(".workspace .contentBlock--scene .page[contenteditable]");
    if (!sel || !sel.rangeCount || !page || !page.contains(sel.anchorNode)) return 0;
    const r = sel.getRangeAt(0).cloneRange();
    r.selectNodeContents(page); r.setEnd(sel.anchorNode, sel.anchorOffset);
    const before = r.toString();
    let acc = 0;
    for (let i = 0; i < units.length; i += 1) { acc += units[i].text.length + 1; if (acc >= before.length) return i; }
    return 0;
  };

  const start = () => {
    setOpen(true);
    const i = st.playing || st.paused ? st.i : startIndex();
    reader.current.load(units, i);
    reader.current.play();
  };
  const setVoice = (uri) => { const v = voices.find((x) => x.voiceURI === uri); if (v) { reader.current.setVoice(v); const p = { ...prefs, voice: uri }; setPrefs(p); savePrefs(p); } };
  const setRate = (r) => { reader.current.setRate(r); const p = { ...prefs, rate: r }; setPrefs(p); savePrefs(p); };
  const close = () => { reader.current.stop(); setOpen(false); };

  const unit = st.unit;
  const pct = st.n ? Math.round((st.i / st.n) * 100) : 0;

  const button = (
      <button type="button" className={"readAloud__btn" + (st.playing ? " is-playing" : "")} title={element.type === "thread" ? "Read the whole thread aloud" : "Read aloud (from the cursor, if it's in the text)"} onClick={st.playing ? () => reader.current.pause() : start}>
        {st.playing ? <FaPause /> : <FaVolumeUp />}
      </button>
  );

  return (
    <>
      {slot ? createPortal(button, slot) : <span className="readAloud__wrap">{button}</span>}
      {open && (
        <div className="readAloud" role="region" aria-label="Read aloud">
          <div className="readAloud__row">
            <button type="button" onClick={() => reader.current.prev()} title="Previous sentence" disabled={st.i === 0}><FaStepBackward /></button>
            {st.playing ? <button type="button" className="primary" onClick={() => reader.current.pause()} title="Pause"><FaPause /></button> : <button type="button" className="primary" onClick={() => reader.current.play()} title="Play"><FaPlay /></button>}
            <button type="button" onClick={() => reader.current.next()} title="Next sentence" disabled={st.i >= st.n - 1}><FaStepForward /></button>
            <button type="button" onClick={close} title="Stop and close"><FaStop /></button>
            <div className="readAloud__now">
              {unit && element.type === "thread" && <span className="readAloud__scene">{unit.sceneName}</span>}
              <span className="readAloud__text">{unit ? unit.text : st.i >= st.n ? "Finished." : ""}</span>
            </div>
            <span className="readAloud__count">{Math.min(st.i + 1, st.n)} / {st.n}</span>
          </div>
          <div className="readAloud__bar" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); reader.current.seek(Math.floor(((e.clientX - r.left) / r.width) * st.n)); }} title="Jump">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="readAloud__row readAloud__prefs">
            <label>Voice
              <select value={prefs.voice || (voices[0] && voices[0].voiceURI) || ""} onChange={(e) => setVoice(e.target.value)}>
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.localService ? "" : " (online)"}</option>)}
              </select>
            </label>
            <label>Speed <input type="range" min={0.6} max={1.8} step={0.1} value={prefs.rate} onChange={(e) => setRate(Number(e.target.value))} /> <b>{prefs.rate.toFixed(1)}×</b></label>
          </div>
        </div>
      )}
    </>
  );
};

export default ReadAloud;
