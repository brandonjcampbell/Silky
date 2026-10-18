import React, { useEffect, useState } from "react";
import { FaSlidersH } from "react-icons/fa";
import { THEMES, getThemeId, setTheme } from "../../theme";
import { UI_FONTS, PROSE_FONTS, DEFAULT_PREFS, loadPrefs, savePrefs } from "../../prefs";
import { LEVELS, getLevel, setLevel } from "../../flow/watcher";
import { isConfigured } from "../../llm/config";
import LlmSettings from "../LlmSettings";
import SpinnerIcon from "../SpinnerIcon";
import "./Preferences.css";

/** Theme, type, Spinner — everything about how Silky looks and behaves, in one place. */
const Preferences = () => {
  const [theme, setT] = useState(getThemeId());
  const [p, setP] = useState(loadPrefs);
  const [level, setLvl] = useState(getLevel());
  useEffect(() => {
    const on = (e) => setLvl(e.detail);
    window.addEventListener("silky-flow-level", on);
    return () => window.removeEventListener("silky-flow-level", on);
  }, []);
  const set = (k, v) => setP((prev) => savePrefs({ ...prev, [k]: v }));
  const pick = (id) => { setTheme(id); setT(id); };

  return (
    <div className="workspace prefs">
      <h1 className="workspaceHeader">
        <span className="typeIcon"><FaSlidersH /></span>
        <p>Preferences</p>
        <span className="workspaceHeader__blurb">Theme, type and Spinner. Kept in this browser.</span>
      </h1>

      <section className="prefs__section">
        <h3>Theme</h3>
        <div className="prefs__themes">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={"prefs__theme" + (theme === t.id ? " is-on" : "")} onClick={() => pick(t.id)} style={{ background: t.bg, color: t.ink, borderColor: theme === t.id ? t.accent : t.line }} title={t.blurb || t.name}>
              <span className="prefs__swatch" style={{ background: t.bgPage, borderColor: t.line }}><i style={{ background: t.accent }} /></span>
              <span className="prefs__themeName" style={{ fontFamily: t.prose || undefined }}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="prefs__section">
        <h3>Type</h3>
        <div className="prefs__grid">
          <label>Prose font<select value={p.proseFont} onChange={(e) => set("proseFont", e.target.value)}>{PROSE_FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          <label>Prose size <span className="prefs__val">{p.proseSize}px</span><input type="range" min="14" max="26" step="1" value={p.proseSize} onChange={(e) => set("proseSize", Number(e.target.value))} /></label>
          <label>Line height <span className="prefs__val">{p.proseLeading}</span><input type="range" min="1.3" max="2.2" step="0.05" value={p.proseLeading} onChange={(e) => set("proseLeading", Number(e.target.value))} /></label>
          <label>Page width <span className="prefs__val">{p.pageWidth} characters</span><input type="range" min="50" max="110" step="2" value={p.pageWidth} onChange={(e) => set("pageWidth", Number(e.target.value))} /></label>
          <label>Interface font<select value={p.uiFont} onChange={(e) => set("uiFont", e.target.value)}>{UI_FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          <label>Interface size <span className="prefs__val">{p.uiSize}%</span><input type="range" min="80" max="130" step="5" value={p.uiSize} onChange={(e) => set("uiSize", Number(e.target.value))} /></label>
        </div>
        <div className="prefs__sample">
          <p>The fog came pouring in at every chink and keyhole, and was so dense without, that although the court was of the narrowest, the houses opposite were mere phantoms.</p>
        </div>
        <button type="button" className="prefs__reset" onClick={() => setP(savePrefs({ ...DEFAULT_PREFS }))}>Reset type</button>
      </section>

      <section className="prefs__section">
        <h3><SpinnerIcon /> Spinner</h3>
        <div className="prefs__grid">
          <label>Flow — what Spinner does while you write
            <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={!isConfigured()}>{LEVELS.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.blurb}</option>)}</select>
          </label>
        </div>
        <h4>Connection</h4>
        <LlmSettings inline />
      </section>
    </div>
  );
};

export default Preferences;
