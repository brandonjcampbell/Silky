/* The keystroke record: evidence that the prose was typed by a person.

   Every input event in a scene editor is counted — typed characters, pasted
   characters, deletions, keystrokes, and the rhythm between them — but never
   the characters themselves. Events are grouped into sessions (a gap of two
   minutes ends one); each session is hashed with the one before it, so the
   record is a chain that can't be quietly edited later without breaking.
   Together with the provenance log (what Spinner wrote) this is what the
   authorship certificate is made from. */
import { existsSync, readFileSync, writeFileSync } from "./storage";

const FILE = "keystrokes.json";
const GAP_MS = 120e3;            // idle this long and the session closes
export const BUCKETS = [100, 200, 400, 800, 2000, 5000, 30000, Infinity]; // inter-key intervals, ms
export const BUCKET_LABELS = ["<0.1s", "0.1–0.2", "0.2–0.4", "0.4–0.8", "0.8–2s", "2–5s", "5–30s", ">30s"];

const empty = () => ({ version: 1, started: Date.now(), head: "", scenes: {}, sessions: [] });
export const loadKeystrokes = (dir) => {
  try { if (existsSync(dir + FILE)) return { ...empty(), ...JSON.parse(readFileSync(dir + FILE)) }; } catch (e) { /* */ }
  return empty();
};
const save = (dir, d) => writeFileSync(dir + FILE, JSON.stringify(d));

/* ── live sessions, one per open scene ── */
const live = new Map(); // key `${dir}|${uuid}` → session
const newSession = (uuid) => ({ uuid, start: Date.now(), end: Date.now(), keys: 0, typed: 0, pasted: 0, deleted: 0, breaks: 0, hist: BUCKETS.map(() => 0), lastKey: 0 });

const sha256 = async (text) => {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) { return ""; }
};

let closing = Promise.resolve();
/** Close a session: append it to the chain and the per-scene totals. */
const close = (dir, key) => {
  const s = live.get(key);
  if (!s) return;
  live.delete(key);
  if (!s.keys && !s.pasted) return;
  const { lastKey, ...rec } = s;
  closing = closing.then(async () => {
    const d = loadKeystrokes(dir);
    rec.prev = d.head;
    rec.h = await sha256(d.head + JSON.stringify(rec));
    d.head = rec.h;
    d.sessions.push(rec);
    const t = d.scenes[s.uuid] || (d.scenes[s.uuid] = { keys: 0, typed: 0, pasted: 0, deleted: 0, breaks: 0, ms: 0, sessions: 0, first: rec.start, hist: BUCKETS.map(() => 0) });
    t.keys += rec.keys; t.typed += rec.typed; t.pasted += rec.pasted; t.deleted += rec.deleted; t.breaks += rec.breaks;
    t.ms += rec.end - rec.start; t.sessions += 1; t.last = rec.end;
    rec.hist.forEach((n, i) => { t.hist[i] = (t.hist[i] || 0) + n; });
    save(dir, d);
    window.dispatchEvent(new CustomEvent("silky-keystrokes"));
  });
};

const touch = (dir, uuid, baselineWords) => {
  const key = `${dir}|${uuid}`;
  let s = live.get(key);
  const now = Date.now();
  if (s && now - s.end > GAP_MS) { close(dir, key); s = null; }
  if (!s) {
    s = newSession(uuid);
    live.set(key, s);
    // the first time a scene is seen, note how many words were already there
    const d = loadKeystrokes(dir);
    if (!d.scenes[uuid] && Number.isFinite(baselineWords)) {
      d.scenes[uuid] = { keys: 0, typed: 0, pasted: 0, deleted: 0, breaks: 0, ms: 0, sessions: 0, first: now, hist: BUCKETS.map(() => 0), baseline: baselineWords };
      save(dir, d);
    }
  }
  s.end = now;
  return s;
};

/**
 * Record one input event in a scene. `kind` is typed | paste | delete | break;
 * `len` is how many characters it added or removed.
 */
export const recordInput = (dir, uuid, kind, len = 1, baselineWords) => {
  if (!dir || !uuid) return;
  const s = touch(dir, uuid, baselineWords);
  const now = Date.now();
  if (kind === "paste") { s.pasted += len; s.keys += 1; }
  else {
    if (kind === "typed") s.typed += len;
    else if (kind === "delete") s.deleted += len;
    else if (kind === "break") s.breaks += 1;
    s.keys += 1;
    if (s.lastKey) {
      const gap = now - s.lastKey;
      const i = BUCKETS.findIndex((b) => gap < b);
      s.hist[i < 0 ? BUCKETS.length - 1 : i] += 1;
    }
    s.lastKey = now;
  }
};

/** Close the open session for a scene (editor unmounting) or every session. */
export const flushKeystrokes = (dir, uuid) => {
  if (uuid) close(dir, `${dir}|${uuid}`);
  else [...live.keys()].filter((k) => k.startsWith(dir + "|")).forEach((k) => close(dir, k));
  return closing;
};
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => { [...live.keys()].forEach((k) => close(k.split("|")[0], k)); });
  setInterval(() => { const now = Date.now(); [...live.entries()].forEach(([k, s]) => { if (now - s.end > GAP_MS) close(k.split("|")[0], k); }); }, 30e3);
}

/** Re-hash the chain and report whether it still holds. */
export const verifyChain = async (d) => {
  let prev = "";
  for (const s of d.sessions) {
    const { h, ...rest } = s;
    if (rest.prev !== prev) return { ok: false, at: s };
    const want = await sha256(prev + JSON.stringify(rest));
    if (want !== h) return { ok: false, at: s };
    prev = h;
  }
  return { ok: prev === (d.head || ""), sessions: d.sessions.length };
};

export const hashText = sha256;
export const fmtMs = (ms) => {
  if (ms < 60e3) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const m = Math.round(ms / 60e3);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
};
