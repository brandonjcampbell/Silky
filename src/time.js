/* Story time. A scene can carry a `when`: an absolute date (and time), or an
   offset from the previous scene in a thread, plus how long it lasts. A
   thread places its scenes on a time axis from those — the Timeline is for
   time what the map is for space. Dates are plain calendar dates; years may
   be anything a Date can hold, so historical and far-future stories work. */

import { activeCalendar, isCustom, dayMs, monthDays, yearDays, parseCustom, fmtCustom, yearOf } from "./calendar";

export const DURATION_UNITS = [
  { id: "minutes", name: "minutes", ms: 60e3 },
  { id: "hours", name: "hours", ms: 3600e3 },
  { id: "days", name: "days", ms: 86400e3 },
  { id: "weeks", name: "weeks", ms: 7 * 86400e3 },
  { id: "months", name: "months", ms: 30.4375 * 86400e3 },
  { id: "years", name: "years", ms: 365.25 * 86400e3 },
];
/** A unit's length in the project's calendar (days, months and years follow it). */
export const unitMs = (id) => {
  const cal = activeCalendar();
  if (isCustom(cal)) {
    if (id === "days") return dayMs(cal);
    if (id === "weeks") return 7 * dayMs(cal);
    if (id === "months") return monthDays(cal) * dayMs(cal);
    if (id === "years") return yearDays(cal) * dayMs(cal);
  }
  return (DURATION_UNITS.find((u) => u.id === id) || DURATION_UNITS[2]).ms;
};
export const toMs = (value, unit) => (Number.isFinite(Number(value)) ? Number(value) * unitMs(unit) : 0);

/** "1897", "1897-05", "1897-05-03", "1897-05-03 21:30", "3 May 1897", "-0400-01-01" (400 BC) → ms, or null. */
export const parseDate = (s, time) => {
  const str = String(s || "").trim();
  if (!str) return null;
  if (isCustom(activeCalendar())) return parseCustom(str, time);
  let m = str.match(/^(-?\d{1,6})(?:-(\d{1,2}))?(?:-(\d{1,2}))?(?:[ T](\d{1,2}):(\d{2}))?$/);
  let d;
  if (m) {
    const y = Number(m[1]);
    d = new Date(0);
    d.setUTCFullYear(y, m[2] ? Number(m[2]) - 1 : 0, m[3] ? Number(m[3]) : 1);
    d.setUTCHours(m[4] ? Number(m[4]) : 0, m[5] ? Number(m[5]) : 0, 0, 0);
  } else {
    const t = Date.parse(str);
    if (Number.isNaN(t)) return null;
    d = new Date(t);
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()));
  }
  if (time) {
    const tm = String(time).match(/^(\d{1,2}):(\d{2})/);
    if (tm) d.setUTCHours(Number(tm[1]), Number(tm[2]), 0, 0);
  }
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
/** A readable date at the precision the span calls for. */
export const fmtDate = (ms, { time = false, year = true } = {}) => {
  if (!Number.isFinite(ms)) return "";
  if (isCustom(activeCalendar())) return fmtCustom(ms, { time, year });
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const yStr = y < 0 ? `${-y} BC` : String(y);
  const base = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year ? " " + yStr : ""}`;
  return time && (d.getUTCHours() || d.getUTCMinutes()) ? `${base}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : base;
};
export const fmtDuration = (ms) => {
  if (!ms) return "";
  const abs = Math.abs(ms);
  const units = DURATION_UNITS.map((u) => ({ ...u, ms: unitMs(u.id) }));
  const pick = [...units].reverse().find((u) => abs >= u.ms * 0.95) || units[0];
  const v = abs / pick.ms;
  const n = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${ms < 0 ? "-" : ""}${n} ${n === 1 ? pick.name.replace(/s$/, "") : pick.name}`;
};

export const EMPTY_WHEN = { date: "", time: "", durationValue: "", durationUnit: "hours", relValue: "", relUnit: "days", note: "" };
export const hasWhen = (s) => { const w = s && s.when; return !!(w && (w.date || w.relValue || w.durationValue || w.note)); };
export const whenSummary = (s) => {
  const w = (s && s.when) || {};
  const parts = [];
  if (w.date) { const ms = parseDate(w.date, w.time); parts.push(ms != null ? fmtDate(ms, { time: !!w.time }) : w.date); }
  else if (w.relValue) parts.push(`${w.relValue} ${w.relUnit} after the previous scene`);
  if (w.durationValue) parts.push(`lasts ${w.durationValue} ${w.durationUnit}`);
  if (w.note) parts.push(w.note);
  return parts.join(" · ");
};

/**
 * Place a thread's scenes in time. Absolute dates anchor; relative offsets
 * chain from the previous placed scene (its end if it has a duration);
 * scenes with neither are inferred to follow the previous one directly
 * (flagged `inferred`) once anything before them is anchored.
 * @returns {{ scene, start, end, duration, anchored, inferred, unplaced }[]}
 */
export const placeScenes = (scenes, known = null) => {
  const out = [];
  let cursor = null; // end of the last placed scene
  scenes.forEach((s) => {
    const w = s.when || {};
    const duration = toMs(w.durationValue, w.durationUnit);
    let start = null, anchored = false, inferred = false;
    const abs = w.date ? parseDate(w.date, w.time) : null;
    const k = known && known.get ? known.get(s.file) : null;
    if (abs != null) { start = abs; anchored = true; }
    else if (k && k.start != null) { start = k.start; inferred = k.inferred; } // placed by the primary thread
    else if (w.relValue !== "" && w.relValue != null && cursor != null) { start = cursor + toMs(w.relValue, w.relUnit); }
    else if (cursor != null) { start = cursor; inferred = true; }
    if (start == null) { out.push({ scene: s, start: null, end: null, duration, anchored: false, inferred: false, unplaced: true }); return; }
    const end = start + duration;
    out.push({ scene: s, start, end, duration, anchored, inferred, unplaced: false });
    cursor = end;
  });
  return out;
};

/** The calendar year of a moment, in the project's calendar. */
export const calendarYear = (ms) => (isCustom(activeCalendar()) ? yearOf(ms) : new Date(ms).getUTCFullYear());
