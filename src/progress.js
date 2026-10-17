/* Writing progress. Every save of a scene logs the words added and removed
   into the project's progress.json by local day, along with what was created
   and which scenes were touched; the Progress analysis draws streaks, goals
   and activity from it. The first time a project has no log, one is
   reconstructed from history.json and from the creation stamps in uuids. */
import { existsSync, readFileSync, writeFileSync } from "./storage";
import { loadHistory } from "./history";

const FILE = "progress.json";
const words = (html) => (String(html || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;

/** Local calendar day key for a timestamp. */
export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dayStart = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
export const addDays = (key, n) => dayKey(dayStart(key) + n * 86400000 + 3600000 * 2); // +2h dodges DST edges

const cache = new Map();
const blank = () => ({ version: 1, goals: { daily: 500, target: null, deadline: null }, days: {} });
const dirOf = (path) => path.slice(0, path.lastIndexOf("/") + 1).replace(/\\/g, "/");

export const loadProgress = (dir) => {
  if (cache.has(dir)) return cache.get(dir);
  let d = null;
  try { if (existsSync(dir + FILE)) d = JSON.parse(readFileSync(dir + FILE)); } catch (e) { d = null; }
  if (!d) { d = backfill(dir); writeFileSync(dir + FILE, JSON.stringify(d)); }
  if (!d.goals) d.goals = blank().goals;
  cache.set(dir, d);
  return d;
};
export const saveProgress = (dir, d) => { cache.set(dir, d); writeFileSync(dir + FILE, JSON.stringify(d)); };
export const setGoals = (dir, goals) => { const d = loadProgress(dir); d.goals = { ...d.goals, ...goals }; saveProgress(dir, d); return d; };

const day = (d, key) => d.days[key] || (d.days[key] = { added: 0, removed: 0, saves: 0, scenes: [], created: {} });

/** Rebuild a log from history versions and creation stamps. */
const backfill = (dir) => {
  const d = blank();
  const hist = loadHistory(dir);
  Object.entries(hist.actors || {}).forEach(([file, versions]) => {
    let prevWords = null;
    versions.forEach((v) => {
      if (prevWords !== null) {
        const delta = (v.words || 0) - prevWords;
        const k = dayKey(v.at);
        const e = day(d, k);
        if (delta > 0) e.added += delta; else e.removed += -delta;
        e.saves += 1;
        if (!e.scenes.includes(file)) e.scenes.push(file);
      }
      prevWords = v.words || 0;
    });
  });
  return d;
};

/** Called from saveFile with the previous and next actor. */
export const trackProgress = (filepath, prev, next) => {
  if (!next || typeof next !== "object" || !/\.element\.json$/.test(filepath)) return;
  const dir = dirOf(filepath.replace(/\\/g, "/"));
  const file = filepath.replace(/\\/g, "/").slice(dir.length);
  let d;
  try { d = loadProgress(dir); } catch (e) { return; }
  const k = dayKey();
  let touched = false;
  if (!prev) {
    const e = day(d, k);
    e.created[next.type] = (e.created[next.type] || 0) + 1;
    touched = true;
  }
  if (next.type === "snippet" && typeof next.content === "string") {
    const before = prev && typeof prev.content === "string" ? words(prev.content) : 0;
    const after = words(next.content);
    const delta = after - before;
    if (delta !== 0 || !prev) {
      const e = day(d, k);
      if (delta > 0) e.added += delta; else e.removed += -delta;
      e.saves += 1;
      if (!e.scenes.includes(file)) e.scenes.push(file);
      touched = true;
    }
  }
  if (touched) saveProgress(dir, d);
};

/* ── derived views ─────────────────────────────────────────────────────── */

/** Days in order from `from` to today inclusive, with their entries (or zeros). */
export const dayRange = (d, from, to = dayKey()) => {
  const out = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push({ key: k, ...(d.days[k] || { added: 0, removed: 0, saves: 0, scenes: [], created: {} }) });
  return out;
};

/** Current and best streaks of days with any words added (or ≥ goal when `meet` is set). */
export const streaks = (d, meet = 0) => {
  const keys = Object.keys(d.days).filter((k) => (d.days[k].added || 0) > meet).sort();
  if (!keys.length) return { current: 0, best: 0 };
  let best = 1, run = 1;
  for (let i = 1; i < keys.length; i += 1) {
    run = addDays(keys[i - 1], 1) === keys[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  // current: counting back from today (yesterday still counts if today is untouched)
  let k = dayKey();
  if (!((d.days[k] || {}).added > meet)) k = addDays(k, -1);
  let current = 0;
  while ((d.days[k] || {}).added > meet) { current += 1; k = addDays(k, -1); }
  return { current, best };
};
