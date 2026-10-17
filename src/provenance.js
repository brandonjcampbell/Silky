/* Provenance of model-written prose. Every passage inserted from a Spinner
   suggestion is wrapped in <span data-ai="spinner" data-ai-id="…"> in the
   scene's HTML and logged in the project's provenance.json, so it can be
   reported on, highlighted, un-marked, or removed later. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "provenance.json";
export const AI_HIGHLIGHT_KEY = "silky:showAi";

export const loadProvenance = (dir) => {
  try {
    if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE));
  } catch (e) {
    /* missing or corrupt */
  }
  return { version: 1, insertions: [] };
};
export const saveProvenance = (dir, data) => writeFileSync(dir + FILE, JSON.stringify(data));

export const newId = () => "ai-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const words = (s) => (String(s).trim().match(/\S+/g) || []).length;

/** HTML for an insertion: one wrapped span per paragraph so block structure survives. */
export const wrapForInsert = (text, id) =>
  String(text)
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<span data-ai="spinner" data-ai-id="${id}">${esc(p).replace(/\n/g, "<br>")}</span>`)
    .join("</p><p>");

/** Log an insertion. */
export const recordInsertion = (dir, { id, file, kind, prompt, text, provider, model }) => {
  const data = loadProvenance(dir);
  data.insertions.push({ id, file, kind, prompt: prompt || "", text, words: words(text), provider, model, at: Date.now() });
  saveProvenance(dir, data);
  return data;
};

/* ── inspecting a scene's HTML ───────────────────────────────────────────── */

const parse = (html) => new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html").body;
const serialize = (body) => body.innerHTML;

/** Current text of an insertion's spans inside the content, or null if gone. */
export const currentText = (html, id) => {
  const body = parse(html);
  const spans = body.querySelectorAll(`[data-ai-id="${id}"]`);
  if (!spans.length) return null;
  return [...spans].map((s) => s.textContent).join("\n\n").trim();
};

/** 0..1 how much of the original wording survives (word-level). */
export const similarity = (a, b) => {
  const wa = String(a).toLowerCase().match(/[a-zÀ-ɏ'’]+/g) || [];
  const wb = String(b).toLowerCase().match(/[a-zÀ-ɏ'’]+/g) || [];
  if (!wa.length && !wb.length) return 1;
  const bag = new Map();
  wb.forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
  let hit = 0;
  wa.forEach((w) => { if (bag.get(w)) { hit += 1; bag.set(w, bag.get(w) - 1); } });
  return hit / Math.max(wa.length, wb.length);
};

/** "verbatim" | "edited" | "removed" | "unmarked" (text still there, markers gone) with detail. */
export const insertionStatus = (html, ins) => {
  const now = currentText(html, ins.id);
  if (now === null) {
    const plain = parse(html).textContent || "";
    const still = ins.text.trim().length > 20 && plain.includes(ins.text.trim().slice(0, 60));
    return { status: still ? "unmarked" : "removed", similarity: still ? 1 : 0, words: still ? ins.words : 0 };
  }
  const sim = similarity(ins.text, now);
  return { status: sim >= 0.97 ? "verbatim" : "edited", similarity: sim, words: words(now), now };
};

/** Count the words inside any AI span in a scene. */
export const aiWords = (html) => {
  const body = parse(html);
  let n = 0;
  body.querySelectorAll("[data-ai]").forEach((s) => { n += words(s.textContent); });
  return { ai: n, total: words(body.textContent || "") };
};

/** Remove an insertion's spans (and their text). Empty paragraphs left behind are dropped. */
export const removeFromHtml = (html, id) => {
  const body = parse(html);
  body.querySelectorAll(id ? `[data-ai-id="${id}"]` : "[data-ai]").forEach((s) => s.remove());
  body.querySelectorAll("p, div").forEach((p) => { if (!p.textContent.trim() && !p.querySelector("img, hr, br")) p.remove(); });
  return serialize(body);
};

/** Keep the text, drop the markers. */
export const unmarkInHtml = (html, id) => {
  const body = parse(html);
  body.querySelectorAll(id ? `[data-ai-id="${id}"]` : "[data-ai]").forEach((s) => s.replaceWith(...s.childNodes));
  return serialize(body);
};

export const getShowAi = () => { try { return localStorage.getItem(AI_HIGHLIGHT_KEY) === "1"; } catch (e) { return false; } };
export const setShowAi = (on) => {
  try { localStorage.setItem(AI_HIGHLIGHT_KEY, on ? "1" : "0"); } catch (e) { /* ignore */ }
  document.documentElement.classList.toggle("show-ai", !!on);
  window.dispatchEvent(new CustomEvent("silky-show-ai", { detail: !!on }));
};
export const applyShowAi = () => document.documentElement.classList.toggle("show-ai", getShowAi());
