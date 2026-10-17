/* Change tracking. Every save of an actor that changes its name or content
   leaves a version in the project's history.json; saves within two minutes
   collapse into one version, so autosave keystrokes make one entry, not a
   hundred. Relationship-only changes (linking) don't make versions but do
   bump the actor's `updated` stamp, which the impact view uses for staleness. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "history.json";
const COLLAPSE_MS = 2 * 60 * 1000;
const MAX_VERSIONS = 40;
const MAX_BYTES = 600 * 1024; // per actor

const dirOf = (path) => path.slice(0, path.lastIndexOf("/") + 1).replace(/\\/g, "/");

const cache = new Map(); // dir -> data
export const loadHistory = (dir) => {
  if (cache.has(dir)) return cache.get(dir);
  let d = { version: 1, actors: {} };
  try {
    if (existsSync(dir + FILE)) d = JSON.parse(readFileSync(dir + FILE));
  } catch (e) {
    /* missing or corrupt */
  }
  cache.set(dir, d);
  return d;
};
const saveHistory = (dir, d) => {
  cache.set(dir, d);
  writeFileSync(dir + FILE, JSON.stringify(d));
};

const contentOf = (a) => (typeof a.content === "string" ? a.content : JSON.stringify(a.content || ""));
const words = (html) => (String(html).replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;

/**
 * Called by saveFile with the previous and next actor JSON. Returns the
 * actor to write (with `updated` set).
 */
export const trackSave = (filepath, prev, next) => {
  if (!next || typeof next !== "object" || !/\.element\.json$/.test(filepath)) return next;
  const now = Date.now();
  const nameChanged = prev && prev.name !== next.name;
  const contentChanged = !prev || contentOf(prev) !== contentOf(next);
  const iconChanged = prev && prev.icon !== next.icon;
  next.updated = now;
  if (!nameChanged && !contentChanged && !iconChanged) return next;

  const dir = dirOf(filepath.replace(/\\/g, "/"));
  const file = filepath.replace(/\\/g, "/").slice(dir.length);
  const data = loadHistory(dir);
  const list = data.actors[file] || (data.actors[file] = []);

  // the very first version records what was there before this save
  if (prev && !list.length) {
    list.push({ at: prev.updated || now - 1, name: prev.name, icon: prev.icon, content: contentOf(prev), words: words(contentOf(prev)), first: true });
  }
  const entry = { at: now, name: next.name, icon: next.icon, content: contentOf(next), words: words(contentOf(next)) };
  const last = list[list.length - 1];
  if (last && !last.first && now - last.at < COLLAPSE_MS && last.name === next.name) {
    list[list.length - 1] = { ...entry, since: last.since || last.at };
  } else {
    list.push(entry);
  }
  // trim by count, then by bytes (oldest first, but always keep the latest two)
  while (list.length > MAX_VERSIONS) list.shift();
  let bytes = list.reduce((n, v) => n + v.content.length, 0);
  while (bytes > MAX_BYTES && list.length > 2) bytes -= list.shift().content.length;
  saveHistory(dir, data);
  return next;
};

export const versionsOf = (dir, file) => (loadHistory(dir).actors[file] || []).slice().reverse();

export const forgetHistory = (dir, file) => {
  const data = loadHistory(dir);
  if (file) delete data.actors[file];
  else data.actors = {};
  saveHistory(dir, data);
};

/* ── word-level diff (LCS) for the history view ──────────────────────── */

const tok = (html) => String(html).replace(/<[^>]+>/g, " ¶ ").replace(/&nbsp;/g, " ").split(/(\s+)/).filter((t) => t.trim()).map((t) => (t === "¶" ? "\n" : t));

/** [{type:"same"|"del"|"ins", text}] — capped for very long texts. */
export const diffWords = (a, b) => {
  const A = tok(a), B = tok(b);
  if (A.length * B.length > 4e6) {
    return [{ type: "del", text: A.join(" ") }, { type: "ins", text: B.join(" ") }];
  }
  const n = A.length, m = B.length;
  const dp = new Uint16Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) {
    dp[i * (m + 1) + j] = A[i] === B[j] ? dp[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + j + 1]);
  }
  const out = [];
  const push = (type, text) => { const l = out[out.length - 1]; if (l && l.type === type) l.text += (text === "\n" || l.text.endsWith("\n") ? "" : " ") + text; else out.push({ type, text }); };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push("same", A[i]); i += 1; j += 1; }
    else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + j + 1]) { push("del", A[i]); i += 1; }
    else { push("ins", B[j]); j += 1; }
  }
  while (i < n) { push("del", A[i]); i += 1; }
  while (j < m) { push("ins", B[j]); j += 1; }
  return out;
};
