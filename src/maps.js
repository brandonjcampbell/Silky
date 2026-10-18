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
/** A closed polyline is a region: it has a fill texture and an area. */
export const newRegion = (points, extra = {}) => ({ id: uid(), points, name: "", color: "", closed: true, texture: "solid", ...extra });

/** Signed shoelace area in map px² */
export const polyArea = (pts) => Math.abs(pts.reduce((n, p, i) => { const q = pts[(i + 1) % pts.length]; return n + p.x * q.y - q.x * p.y; }, 0)) / 2;
export const fmtArea = (map, px2) => {
  if (!map.scale || !map.scale.length) return `${Math.round(px2 / 1000)}k px²`;
  const spx = dist(map.scale.a, map.scale.b);
  if (!spx) return "";
  const u = px2 * (map.scale.length / spx) ** 2;
  const n = u >= 100 ? Math.round(u) : u >= 10 ? Math.round(u * 10) / 10 : Math.round(u * 100) / 100;
  return `${n.toLocaleString()} sq ${map.unit}`;
};

/** Fill textures for regions. Each draws in a 40×40 tile in the region's colour. */
export const TEXTURES = [
  { id: "solid", name: "Solid", color: "#c8b89a" },
  { id: "water", name: "Water", color: "#5b9bd5" },
  { id: "grass", name: "Grass", color: "#6aa84f" },
  { id: "forest", name: "Forest", color: "#38761d" },
  { id: "rock", name: "Rock", color: "#8d8d8d" },
  { id: "sand", name: "Sand", color: "#d9b36c" },
  { id: "marsh", name: "Marsh", color: "#7a9a5a" },
  { id: "snow", name: "Snow", color: "#9fb7c9" },
  { id: "town", name: "Built up", color: "#b06a4a" },
];
export const textureOf = (id) => TEXTURES.find((t) => t.id === id) || TEXTURES[0];

