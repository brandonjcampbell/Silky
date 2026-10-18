/* Timelines: saved views that put one or more threads on a shared time axis,
   kept in the project's timelines.json. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "timelines.json";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const LANE_COLORS = ["#e0245e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899"];

export const loadTimelines = (dir) => {
  try { if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE)); } catch (e) { /* */ }
  return { version: 1, timelines: [] };
};
const save = (dir, d) => { writeFileSync(dir + FILE, JSON.stringify(d)); window.dispatchEvent(new CustomEvent("silky-timelines")); };
export const timelineById = (dir, id) => loadTimelines(dir).timelines.find((t) => t.id === id) || null;
export const newTimeline = (dir, name = "New timeline", threads = []) => {
  const d = loadTimelines(dir);
  const t = { id: uid(), name, threads, created: Date.now(), updated: Date.now() };
  d.timelines.push(t);
  save(dir, d);
  return t;
};
export const updateTimeline = (dir, t) => {
  const d = loadTimelines(dir);
  const i = d.timelines.findIndex((x) => x.id === t.id);
  const next = { ...t, updated: Date.now() };
  if (i >= 0) d.timelines[i] = next; else d.timelines.push(next);
  save(dir, d);
  return next;
};
export const deleteTimeline = (dir, id) => { const d = loadTimelines(dir); d.timelines = d.timelines.filter((t) => t.id !== id); save(dir, d); };
