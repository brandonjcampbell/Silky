/* Typeset a thread (or one scene) for print. Builds a self-contained HTML
   document; the browser's print dialog turns it into paper or a PDF. Running
   headers use position:fixed, which browsers repeat on every printed page. */
import { unmarkInHtml } from "./provenance";

export const FONTS = [
  { id: "garamond", name: "Garamond", css: `"EB Garamond", Garamond, "Adobe Garamond Pro", "Cormorant Garamond", Georgia, serif` },
  { id: "georgia", name: "Georgia", css: `Georgia, "Times New Roman", serif` },
  { id: "times", name: "Times New Roman", css: `"Times New Roman", Times, serif` },
  { id: "palatino", name: "Palatino", css: `Palatino, "Palatino Linotype", "Book Antiqua", "URW Palladio L", serif` },
  { id: "baskerville", name: "Baskerville", css: `Baskerville, "Libre Baskerville", "Baskerville Old Face", Georgia, serif` },
  { id: "courier", name: "Courier (manuscript format)", css: `"Courier New", Courier, "Courier Prime", monospace` },
  { id: "helvetica", name: "Helvetica / Arial", css: `Helvetica, Arial, "Liberation Sans", sans-serif` },
];
export const PAGES = { letter: { w: "8.5in", h: "11in", name: "US Letter" }, a4: { w: "210mm", h: "297mm", name: "A4" }, a5: { w: "148mm", h: "210mm", name: "A5" }, digest: { w: "5.5in", h: "8.5in", name: "Digest (5.5 × 8.5 in)" }, trade: { w: "6in", h: "9in", name: "Trade (6 × 9 in)" } };

export const DEFAULTS = {
  font: "garamond", size: 12, leading: 1.5, paragraphs: "indent", align: "justify",
  page: "letter", marginTop: 1, marginRight: 1, marginBottom: 1, marginLeft: 1,
  titlePage: true, title: "", author: "",
  header: true, headerLeft: "", headerRight: "", headerSize: 9,
  headings: true, newPage: true, breakGlyph: "* * *", dropNumbers: false, smallCapsOpen: false,
};
const KEY = "silky:print";
export const loadPrefs = () => { try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }; } catch (e) { return { ...DEFAULTS }; } };
export const savePrefs = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Clean a scene's HTML for the page: no AI markers, no editor leftovers, no empty paragraphs. */
export const cleanScene = (html) => {
  const body = new DOMParser().parseFromString(`<body>${unmarkInHtml(html || "")}</body>`, "text/html").body;
  body.querySelectorAll("[style], [class], [id], [contenteditable], [data-placeholder]").forEach((el) => { ["style", "class", "id", "contenteditable", "data-placeholder"].forEach((a) => el.removeAttribute(a)); });
  body.querySelectorAll("script, iframe, object").forEach((el) => el.remove());
  body.querySelectorAll("div").forEach((d) => { const p = document.createElement("p"); p.innerHTML = d.innerHTML; d.replaceWith(p); });
  body.querySelectorAll("p").forEach((p) => { if (!p.textContent.replace(/[\s​ ]/g, "") && !p.querySelector("img, hr, br")) p.remove(); });
  [...body.childNodes].forEach((n) => { if (n.nodeType === 3 && n.nodeValue.trim()) { const p = document.createElement("p"); p.textContent = n.nodeValue; n.replaceWith(p); } });
  return body.innerHTML.replace(/​/g, "");
};

const fontCss = (id) => (FONTS.find((f) => f.id === id) || FONTS[0]).css;

/**
 * @param {object} p
 * @param {string} p.title            document title
 * @param {{name, content}[]} p.scenes
 * @param {object} p.prefs
 */
export const buildPrintHtml = ({ title, scenes, prefs }) => {
  const o = { ...DEFAULTS, ...prefs };
  const pg = PAGES[o.page] || PAGES.letter;
  const headerOn = o.header && (o.headerLeft || o.headerRight);
  const headerH = headerOn ? `${Math.round(o.headerSize * 1.6)}pt` : "0pt";
  const css = `
@page { size: ${pg.w} ${pg.h}; margin: ${o.marginTop}in ${o.marginRight}in ${o.marginBottom}in ${o.marginLeft}in; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { font-family: ${fontCss(o.font)}; font-size: ${o.size}pt; line-height: ${o.leading}; text-align: ${o.align}; hyphens: auto; -webkit-hyphens: auto; }
.running { position: fixed; top: 0; left: 0; right: 0; height: ${headerH}; font-size: ${o.headerSize}pt; line-height: ${headerH}; display: flex; justify-content: space-between; color: #333; font-variant: small-caps; letter-spacing: 0.04em; }
.content { ${headerOn ? `padding-top: calc(${headerH} + 0.5em);` : ""} }
.titlePage { height: calc(${pg.h} - ${o.marginTop}in - ${o.marginBottom}in - 0.02in); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; break-after: page; }
.titlePage h1 { font-size: ${Math.round(o.size * 2.4)}pt; font-weight: normal; letter-spacing: 0.02em; margin: 0 0 0.6em; line-height: 1.15; }
.titlePage .by { font-size: ${Math.round(o.size * 1.2)}pt; font-style: italic; }
.scene { ${o.newPage ? "page-break-before: always; break-before: page;" : ""} }
.scene:first-of-type { page-break-before: auto; break-before: auto; }
.scene h2 { font-size: ${Math.round(o.size * 1.5)}pt; font-weight: normal; text-align: center; margin: ${o.newPage ? "2.2in" : "2em"} 0 1.6em; line-height: 1.2; page-break-after: avoid; break-after: avoid; }
.scene h2 small { display: block; font-size: ${o.size}pt; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.8em; }
.break { text-align: center; margin: 1.4em 0; letter-spacing: 0.4em; page-break-inside: avoid; }
p { margin: 0; orphans: 2; widows: 2; }
${o.paragraphs === "indent" ? `p + p { text-indent: 1.5em; } .scene h2 + p, .break + p { text-indent: 0; }` : `p { margin: 0 0 0.8em; }`}
${o.smallCapsOpen ? `.scene h2 + p::first-line, .titlePage + .scene > p:first-of-type::first-line { font-variant: small-caps; letter-spacing: 0.04em; }` : ""}
h1, h2, h3, h4 { font-weight: normal; }
blockquote { margin: 1em 2em; }
img { max-width: 100%; }
hr { border: 0; text-align: center; margin: 1.4em 0; }
hr::after { content: "${esc(o.breakGlyph).replace(/"/g, '\\"')}"; letter-spacing: 0.4em; }
.content h3, .content h4 { text-align: center; margin: 1.8em 0 0.8em; }
@media screen { body { background: #777; } .sheet { width: ${pg.w}; min-height: ${pg.h}; box-sizing: border-box; margin: 0.4in auto; padding: ${o.marginTop}in ${o.marginRight}in ${o.marginBottom}in ${o.marginLeft}in; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.4); position: relative; } .running { position: absolute; left: ${o.marginLeft}in; right: ${o.marginRight}in; top: ${o.marginTop}in; } .titlePage { page-break-after: auto; } }
@media print { .sheet { margin: 0; padding: 0; box-shadow: none; width: auto; min-height: 0; } }
`;
  const num = (i) => (o.dropNumbers ? "" : `<small>Chapter ${i + 1}</small>`);
  const body = scenes.map((s, i) => {
    const heading = o.headings ? `<h2>${num(i)}${esc(s.name)}</h2>` : (i && !o.newPage ? `<div class="break">${esc(o.breakGlyph)}</div>` : "");
    return `<section class="scene">${heading}${cleanScene(s.content)}</section>`;
  }).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>
<div class="sheet">
${headerOn ? `<div class="running"><span>${esc(o.headerLeft)}</span><span>${esc(o.headerRight)}</span></div>` : ""}
${o.titlePage ? `<div class="titlePage"><h1>${esc(o.title || title)}</h1>${o.author ? `<div class="by">${esc(o.author)}</div>` : ""}</div>` : ""}
<div class="content">
${body}
</div></div></body></html>`;
};

/** Open the typeset document in a new window and summon the print dialog. */
export const printHtml = (html) => {
  const w = window.open("", "_blank");
  if (!w) throw new Error("The browser blocked the print window — allow pop-ups for this site.");
  w.document.open();
  w.document.write(html);
  w.document.close();
  const go = () => { try { w.focus(); w.print(); } catch (e) { /* user closed it */ } };
  if (w.document.readyState === "complete") setTimeout(go, 250); else w.addEventListener("load", () => setTimeout(go, 250));
};

export const downloadHtml = (html, name) => {
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[/\\?%*:|"<>]/g, "")}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
