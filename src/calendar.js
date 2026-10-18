/* A project's calendar. Gregorian by default; or your own — any months of
   any lengths, a year 0, your own era name — kept in the project's
   calendar.json. Story time is still measured in milliseconds underneath,
   so durations, offsets and timelines work the same either way. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "calendar.json";
export const GREGORIAN = { mode: "gregorian" };
export const CUSTOM_DEFAULT = {
  mode: "custom",
  era: "",
  hoursPerDay: 24,
  months: [
    { name: "First Month", days: 30 }, { name: "Second Month", days: 30 }, { name: "Third Month", days: 30 }, { name: "Fourth Month", days: 30 },
    { name: "Fifth Month", days: 30 }, { name: "Sixth Month", days: 30 }, { name: "Seventh Month", days: 30 }, { name: "Eighth Month", days: 30 },
    { name: "Ninth Month", days: 30 }, { name: "Tenth Month", days: 30 }, { name: "Eleventh Month", days: 30 }, { name: "Twelfth Month", days: 30 },
  ],
};

let active = GREGORIAN;
const listeners = new Set();
export const activeCalendar = () => active;
export const onCalendar = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const loadCalendar = (dir) => {
  try { if (dir && existsSync(dir + FILE)) { const c = JSON.parse(readFileSync(dir + FILE)); if (c && c.mode === "custom" && Array.isArray(c.months) && c.months.length) return { ...CUSTOM_DEFAULT, ...c }; } } catch (e) { /* */ }
  return GREGORIAN;
};
export const saveCalendar = (dir, cal) => { writeFileSync(dir + FILE, JSON.stringify(cal)); setActiveCalendar(cal); return cal; };
/** Called when a project opens so dates everywhere read in its calendar. */
export const setActiveCalendar = (cal) => { active = cal && cal.mode === "custom" ? { ...CUSTOM_DEFAULT, ...cal } : GREGORIAN; listeners.forEach((fn) => fn(active)); window.dispatchEvent(new CustomEvent("silky-calendar")); };
export const activateProjectCalendar = (dir) => setActiveCalendar(loadCalendar(dir));

export const isCustom = (cal = active) => cal.mode === "custom";
export const dayMs = (cal = active) => (isCustom(cal) ? cal.hoursPerDay : 24) * 3600e3;
export const yearDays = (cal = active) => (isCustom(cal) ? cal.months.reduce((n, m) => n + Number(m.days || 0), 0) : 365.25);
export const monthDays = (cal = active) => (isCustom(cal) ? yearDays(cal) / cal.months.length : 30.4375);

/** "Y-M-D [HH:MM]" or "D MonthName Y" in a custom calendar → ms, or null. */
export const parseCustom = (s, time, cal = active) => {
  const str = String(s || "").trim();
  if (!str) return null;
  let y, mo = 1, d = 1, hh = 0, mm = 0;
  let m = str.match(/^(-?\d+)(?:[-/.](\d+))?(?:[-/.](\d+))?(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (m) { y = Number(m[1]); mo = m[2] ? Number(m[2]) : 1; d = m[3] ? Number(m[3]) : 1; if (m[4]) { hh = Number(m[4]); mm = Number(m[5]); } }
  else {
    // "3 Frostfall 12" / "Frostfall 3, 12" / "3 Frostfall"
    const names = cal.months.map((x) => String(x.name).toLowerCase());
    const words = str.toLowerCase().replace(/,/g, " ").split(/\s+/);
    const mi = words.findIndex((w) => names.some((n) => n.startsWith(w) && w.length >= 3));
    if (mi < 0) return null;
    mo = names.findIndex((n) => n.startsWith(words[mi])) + 1;
    const nums = words.filter((w, i) => i !== mi && /^-?\d+$/.test(w)).map(Number);
    d = nums.length ? nums[0] : 1;
    y = nums.length > 1 ? nums[1] : 0;
    const t = str.match(/(\d{1,2}):(\d{2})/); if (t) { hh = Number(t[1]); mm = Number(t[2]); }
  }
  if (time) { const t = String(time).match(/^(\d{1,2}):(\d{2})/); if (t) { hh = Number(t[1]); mm = Number(t[2]); } }
  mo = Math.max(1, Math.min(cal.months.length, mo));
  const before = cal.months.slice(0, mo - 1).reduce((n, x) => n + Number(x.days || 0), 0);
  const days = y * yearDays(cal) + before + (d - 1);
  return days * dayMs(cal) + (hh * 60 + mm) * 60e3;
};

export const fmtCustom = (ms, { time = false, year = true } = {}, cal = active) => {
  if (!Number.isFinite(ms)) return "";
  const dms = dayMs(cal);
  let days = Math.floor(ms / dms);
  const rem = ms - days * dms;
  const yd = yearDays(cal);
  let y = Math.floor(days / yd);
  let doy = days - y * yd;
  let mo = 0;
  while (mo < cal.months.length - 1 && doy >= Number(cal.months[mo].days || 0)) { doy -= Number(cal.months[mo].days || 0); mo += 1; }
  const d = doy + 1;
  const hh = Math.floor(rem / 3600e3), mm = Math.floor((rem % 3600e3) / 60e3);
  const base = `${d} ${cal.months[mo].name}${year ? ` ${y}${cal.era ? " " + cal.era : ""}` : ""}`;
  return time && (hh || mm) ? `${base}, ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` : base;
};
export const yearOf = (ms, cal = active) => Math.floor(ms / (yearDays(cal) * dayMs(cal)));
