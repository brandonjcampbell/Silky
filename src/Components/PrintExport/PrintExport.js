import React, { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaPrint } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadFile } from "../../utils/";
import Modal from "../Modal";
import { FONTS, PAGES, DEFAULTS, loadPrefs, savePrefs, buildPrintHtml, printHtml, downloadHtml } from "../../print";
import "./PrintExport.css";

/**
 * Export for print: typeset a thread (or one scene) with your own font, page
 * size, margins, running header and title page, then print or save as PDF.
 */
const PrintExport = ({ element }) => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [err, setErr] = useState(null);
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
  }, [element, dir, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = element.type === "thread" && element.name !== "Manuscript" ? `${state.project} — ${element.name}` : element.type === "thread" ? state.project : element.name;
  const effective = { ...prefs, title: prefs.title || title, headerRight: prefs.header && !prefs.headerLeft && !prefs.headerRight ? (prefs.title || title) : prefs.headerRight };
  const html = useMemo(() => (open ? buildPrintHtml({ title, scenes, prefs: effective }) : ""), [open, title, scenes, prefs]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = useMemo(() => scenes.reduce((n, s) => n + (String(s.content || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length, 0), [scenes]);

  const set = (k, v) => setPrefs((p) => { const n = { ...p, [k]: v }; savePrefs(n); return n; });
  const num = (k, v, min, max) => { const x = Number(v); if (!Number.isNaN(x)) set(k, Math.min(max, Math.max(min, x))); };
  const reset = () => { setPrefs({ ...DEFAULTS }); savePrefs(DEFAULTS); };
  const doPrint = () => { setErr(null); try { printHtml(html); } catch (e) { setErr(e.message); } };

  if (!scenes.length) return null;
  const button = (
    <button type="button" className="printExport__btn" title="Export for print — fonts, margins, headers; print or save as PDF" onClick={() => setOpen(true)}>
      <FaPrint />
    </button>
  );
  return (
    <>
      {slot ? createPortal(button, slot) : <div className="printExport__wrap">{button}</div>}
      {open && (
        <Modal
          title={`Export for print — ${title}`}
          xl
          onClose={() => setOpen(false)}
          footer={
            <>
              <span className="muted">{scenes.length} scene{scenes.length === 1 ? "" : "s"} · {words.toLocaleString()} words</span>
              <span className="spacer" />
              <button type="button" onClick={reset}>Reset</button>
              <button type="button" onClick={() => downloadHtml(html, effective.title)}>Download HTML</button>
              <button type="button" className="primary" onClick={doPrint}>Print / Save as PDF…</button>
            </>
          }
        >
          <div className="printExport">
            <div className="printExport__form">
              <h4>Type</h4>
              <label className="field"><span>Font</span>
                <select value={prefs.font} onChange={(e) => set("font", e.target.value)}>{FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
              </label>
              <div className="printExport__row">
                <label className="field"><span>Size (pt)</span><input type="number" min="8" max="18" step="0.5" value={prefs.size} onChange={(e) => num("size", e.target.value, 8, 18)} /></label>
                <label className="field"><span>Line spacing</span><input type="number" min="1" max="2.5" step="0.05" value={prefs.leading} onChange={(e) => num("leading", e.target.value, 1, 2.5)} /></label>
              </div>
              <div className="printExport__row">
                <label className="field"><span>Paragraphs</span>
                  <select value={prefs.paragraphs} onChange={(e) => set("paragraphs", e.target.value)}><option value="indent">First-line indent</option><option value="spaced">Space between</option></select>
                </label>
                <label className="field"><span>Alignment</span>
                  <select value={prefs.align} onChange={(e) => set("align", e.target.value)}><option value="justify">Justified</option><option value="left">Left</option></select>
                </label>
              </div>
              <label className="check"><input type="checkbox" checked={prefs.smallCapsOpen} onChange={(e) => set("smallCapsOpen", e.target.checked)} /> Small caps on each chapter's first line</label>

              <h4>Page</h4>
              <label className="field"><span>Paper</span>
                <select value={prefs.page} onChange={(e) => set("page", e.target.value)}>{Object.entries(PAGES).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}</select>
              </label>
              <div className="printExport__row printExport__row--4">
                {[["marginTop", "Top"], ["marginRight", "Right"], ["marginBottom", "Bottom"], ["marginLeft", "Left"]].map(([k, l]) => (
                  <label key={k} className="field"><span>{l} (in)</span><input type="number" min="0.25" max="3" step="0.05" value={prefs[k]} onChange={(e) => num(k, e.target.value, 0.25, 3)} /></label>
                ))}
              </div>

              <h4>Front matter</h4>
              <label className="check"><input type="checkbox" checked={prefs.titlePage} onChange={(e) => set("titlePage", e.target.checked)} /> Title page</label>
              <label className="field"><span>Title</span><input type="text" value={prefs.title} placeholder={title} onChange={(e) => set("title", e.target.value)} /></label>
              <label className="field"><span>Author</span><input type="text" value={prefs.author} placeholder="Your name" onChange={(e) => set("author", e.target.value)} /></label>

              <h4>Running header</h4>
              <label className="check"><input type="checkbox" checked={prefs.header} onChange={(e) => set("header", e.target.checked)} /> Header on every page</label>
              <div className="printExport__row">
                <label className="field"><span>Left</span><input type="text" value={prefs.headerLeft} placeholder={prefs.author || "Author"} onChange={(e) => set("headerLeft", e.target.value)} disabled={!prefs.header} /></label>
                <label className="field"><span>Right</span><input type="text" value={prefs.headerRight} placeholder={title} onChange={(e) => set("headerRight", e.target.value)} disabled={!prefs.header} /></label>
              </div>
              <label className="field"><span>Header size (pt)</span><input type="number" min="6" max="12" step="0.5" value={prefs.headerSize} onChange={(e) => num("headerSize", e.target.value, 6, 12)} disabled={!prefs.header} /></label>
              <p className="hint">Browsers can't number pages from a web page; the header carries author and title instead. Page numbers can be turned on in the print dialog's headers-and-footers option.</p>

              <h4>Chapters</h4>
              <label className="check"><input type="checkbox" checked={prefs.headings} onChange={(e) => set("headings", e.target.checked)} /> Scene names as chapter headings</label>
              <label className="check"><input type="checkbox" checked={!prefs.dropNumbers} onChange={(e) => set("dropNumbers", !e.target.checked)} disabled={!prefs.headings} /> Number them (“Chapter 1”)</label>
              <label className="check"><input type="checkbox" checked={prefs.newPage} onChange={(e) => set("newPage", e.target.checked)} /> Each scene starts a new page</label>
              <label className="field"><span>Scene break mark</span><input type="text" value={prefs.breakGlyph} onChange={(e) => set("breakGlyph", e.target.value)} /></label>
              {err && <p className="hint" style={{ color: "var(--accent)" }}>{err}</p>}
            </div>
            <div className="printExport__preview">
              <iframe title="Print preview" srcDoc={html} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default PrintExport;
