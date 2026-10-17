/* Flow mode: Spinner watches the scene you are writing and keeps the bible
   current. After you pause, it reads what you've added, works out which
   known facts the scene now establishes and what new people, places and
   facts have appeared, and either asks (toasts) or just does it, depending
   on the level you chose. Everything it does can be undone from the toast. */
import { loadDir, loadFile } from "../utils/";
import { isConfigured } from "../llm/config";
import { scanWithModel } from "../llm/scan";
import { scanSnippet } from "../analysis/links";
import { similarity } from "../provenance";
import { existsSync, readFileSync, writeFileSync } from "../storage";
import { linkFact, createElement, createFact } from "./apply";

export const LEVELS = [
  { id: "off", name: "Off", blurb: "Spinner waits to be asked." },
  { id: "ask", name: "Ask", blurb: "Spinner watches and offers: link this fact? add this person? You tap yes or no." },
  { id: "link", name: "Auto-link", blurb: "Links the facts a scene establishes on its own; asks before creating anything." },
  { id: "auto", name: "Autopilot", blurb: "Links, creates elements and facts as they appear, and tells you what it did. Undo is one tap." },
];
const KEY = "silky:flow";
export const getLevel = () => { try { return localStorage.getItem(KEY) || "off"; } catch (e) { return "off"; } };
export const setLevel = (l) => { try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ } window.dispatchEvent(new CustomEvent("silky-flow-level", { detail: l })); };

const IDLE_MS = 7000;        // pause before Spinner reads
const MIN_NEW_WORDS = 25;    // how much must have changed since the last read
const FIRST_WORDS = 40;      // or how much a fresh scene needs before a first read
const FILE = "flow.json";

const words = (t) => (String(t || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []);

/* dismissals, per project */
const memo = (dir) => { try { if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE)); } catch (e) { /* */ } return { version: 1, dismissed: {} }; };
const remember = (dir, key) => { const d = memo(dir); d.dismissed[key] = Date.now(); writeFileSync(dir + FILE, JSON.stringify(d)); };
const dismissed = (dir, key) => !!memo(dir).dismissed[key];

/* a single watcher per page */
let dir = null;
let timer = null;
let busy = false;
let seen = new Map(); // sceneFile -> word count at last read
let listeners = new Set();
let toasts = [];
let status = "idle"; // idle | waiting | reading

const emit = () => listeners.forEach((l) => l({ toasts: [...toasts], status, level: getLevel() }));
export const subscribe = (fn) => { listeners.add(fn); fn({ toasts: [...toasts], status, level: getLevel() }); return () => listeners.delete(fn); };
export const setDir = (d) => { if (d !== dir) { dir = d; seen = new Map(); toasts = []; emit(); } };

let nextId = 1;
const push = (t) => { toasts = [...toasts.filter((x) => !(x.key && x.key === t.key)), { id: nextId++, at: Date.now(), ...t }]; if (toasts.length > 4) toasts = toasts.slice(-4); emit(); };
export const dismiss = (id, rememberKey) => { const t = toasts.find((x) => x.id === id); if (t && rememberKey && t.key && dir) remember(dir, t.key); toasts = toasts.filter((x) => x.id !== id); emit(); };
export const act = (id, which = "primary") => {
  const t = toasts.find((x) => x.id === id);
  if (!t) return;
  const fn = which === "primary" ? t.onPrimary : t.onSecondary;
  toasts = toasts.filter((x) => x.id !== id); emit();
  try { fn && fn(); } catch (e) { push({ kind: "info", text: "That didn't work: " + (e.message || e), ttl: 6000 }); }
  window.dispatchEvent(new CustomEvent("silky-flow-changed"));
};

const info = (text, undo, key) => push({ kind: "info", text, key, ttl: 9000, onPrimary: undo, primary: undo ? "Undo" : null });

const onSaved = (e) => {
  const d = e.detail || {};
  if (!dir || !d.path || !d.path.startsWith(dir) || d.type !== "snippet") return;
  if (getLevel() === "off" || !isConfigured()) return;
  const s = loadFile(d.path);
  if (!s || typeof s.content !== "string") return;
  const n = words(s.content).length;
  const last = seen.has(s.file) ? seen.get(s.file) : null;
  const enough = last === null ? n >= FIRST_WORDS : Math.abs(n - last) >= MIN_NEW_WORDS;
  if (!enough) return;
  clearTimeout(timer);
  status = "waiting"; emit();
  timer = setTimeout(() => read(s.file), IDLE_MS);
};

const read = async (sceneFile) => {
  if (busy || !dir) return;
  const s = loadFile(dir + sceneFile);
  if (!s) return;
  busy = true; status = "reading"; emit();
  try {
    const actors = loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
    const scan = scanSnippet(s, actors);
    seen.set(s.file, words(s.content).length);
    const level = getLevel();
    const out = await scanWithModel({
      scene: { name: s.name, text: scan.text.slice(-14000) },
      cast: scan.mentioned.map((m) => m.element.name),
      candidates: scan.facts.map((c) => c.fact.name),
    });
    const fresh = loadFile(dir + s.file) || s;
    // 1. facts this scene establishes
    out.established.forEach((i) => {
      const c = scan.facts[i]; if (!c) return;
      const key = `fact:${c.fact.file}|${s.file}`;
      if (fresh.reveals.includes(c.fact.file) || dismissed(dir, key)) return;
      if (level === "link" || level === "auto") {
        const undo = linkFact(dir, s.file, c.fact.file);
        info(`Linked: “${s.name}” now reveals ${c.fact.icon} ${c.fact.name}`, undo, key);
      } else {
        push({ kind: "ask", key, text: `This scene seems to establish ${c.fact.icon} ${c.fact.name}. Link it?`, primary: "Link", secondary: "Not here", onPrimary: () => linkFact(dir, s.file, c.fact.file), onSecondary: () => remember(dir, key) });
      }
    });
    // 2. new elements
    const names = new Set(actors.filter((a) => a.type === "element").map((a) => a.name.toLowerCase()));
    out.newElements.slice(0, 3).forEach((e) => {
      const key = `name:${e.name.toLowerCase()}`;
      if (names.has(e.name.toLowerCase()) || dismissed(dir, key)) return;
      if (level === "auto") {
        const { undo } = createElement(dir, e);
        names.add(e.name.toLowerCase());
        info(`Added ${e.icon || "🔹"} ${e.name} to the elements${e.description ? ` — ${e.description}` : ""}`, undo, key);
      } else {
        push({ kind: "ask", key, text: `New here: ${e.icon || "🔹"} ${e.name}${e.description ? ` — ${e.description}` : ""}. Add as an element?`, primary: "Add", secondary: "Skip", onPrimary: () => createElement(dir, e), onSecondary: () => remember(dir, key) });
      }
    });
    // 3. new facts (skip anything close to a fact we already have)
    const factNames = actors.filter((a) => a.type === "fact").map((a) => a.name);
    out.newFacts.slice(0, 3).forEach((f) => {
      const key = `new:${f.statement.toLowerCase().slice(0, 80)}`;
      if (dismissed(dir, key) || factNames.some((n) => similarity(n, f.statement) >= 0.75)) return;
      const who = f.involves.length ? ` (${f.involves.join(", ")})` : "";
      if (level === "auto") {
        const r = createFact(dir, s.file, f, { createMissing: true });
        if (r) info(`New fact: 💡 ${f.statement}${who} — revealed here`, r.undo, key);
      } else {
        push({ kind: "ask", key, text: `New fact: 💡 ${f.statement}${who}. Add it and reveal it in this scene?`, primary: "Add", secondary: "Skip", onPrimary: () => createFact(dir, s.file, f, { createMissing: true }), onSecondary: () => remember(dir, key) });
      }
    });
    if (level !== "ask") window.dispatchEvent(new CustomEvent("silky-flow-changed"));
  } catch (e) {
    if (!e || e.name !== "AbortError") push({ kind: "info", text: "Spinner couldn't read the scene: " + (e.message || e), ttl: 8000 });
  } finally {
    busy = false; status = "idle"; emit();
  }
};

let started = false;
export const start = () => {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("silky-saved", onSaved);
  setInterval(() => { const n = toasts.filter((t) => !t.ttl || Date.now() - t.at < t.ttl); if (n.length !== toasts.length) { toasts = n; emit(); } }, 1000);
};
