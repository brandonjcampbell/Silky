/* Maps: an image (or a blank sheet) with a scale, pins for locations and
   polylines for routes, kept in the project's maps.json. Distances come
   from the scale: two points on the map and what they are apart in life. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "maps.json";
export const UNITS = ["miles", "km", "m", "ft", "yards", "leagues", "days' walk", "hours' ride", "minutes"];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const loadMaps = (dir) => {
  try { if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE)); } catch (e) { /* */ }
  return { version: 1, maps: [] };
};
export const saveMaps = (dir, d) => writeFileSync(dir + FILE, JSON.stringify(d));
export const mapById = (dir, id) => loadMaps(dir).maps.find((m) => m.id === id) || null;

export const newMap = (dir, name = "New map") => {
  const d = loadMaps(dir);
  const m = { id: uid(), name, image: null, w: 2000, h: 1400, unit: "miles", scale: null, pins: [], lines: [], created: Date.now(), updated: Date.now() };
  d.maps.push(m);
  saveMaps(dir, d);
  window.dispatchEvent(new CustomEvent("silky-maps"));
  return m;
};
export const updateMap = (dir, map) => {
  const d = loadMaps(dir);
  const i = d.maps.findIndex((m) => m.id === map.id);
  const next = { ...map, updated: Date.now() };
  if (i >= 0) d.maps[i] = next; else d.maps.push(next);
  saveMaps(dir, d);
  window.dispatchEvent(new CustomEvent("silky-maps"));
  return next;
};
export const deleteMap = (dir, id) => {
  const d = loadMaps(dir);
  d.maps = d.maps.filter((m) => m.id !== id);
  saveMaps(dir, d);
  window.dispatchEvent(new CustomEvent("silky-maps"));
};

/* ── geometry ── */
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const pathLength = (pts) => pts.reduce((n, p, i) => (i ? n + dist(pts[i - 1], p) : 0), 0);
/** map pixels → real units, or null without a scale */
export const toUnits = (map, px) => {
  if (!map.scale || !map.scale.length) return null;
  const spx = dist(map.scale.a, map.scale.b);
  return spx ? (px / spx) * map.scale.length : null;
};
export const fmtDist = (map, px) => {
  const u = toUnits(map, px);
  if (u == null) return `${Math.round(px)} px`;
  const n = u >= 100 ? Math.round(u) : u >= 10 ? Math.round(u * 10) / 10 : Math.round(u * 100) / 100;
  return `${n.toLocaleString()} ${map.unit}`;
};
export const newPin = (x, y, extra = {}) => ({ id: uid(), x, y, element: null, label: "", ...extra });
export const newLine = (points, extra = {}) => ({ id: uid(), points, name: "", color: "", ...extra });
