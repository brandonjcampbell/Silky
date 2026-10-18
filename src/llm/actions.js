/* Things Spinner can do to the project when asked — the same edits the
   writer makes by hand, expressed as small JSON actions in a reply. Each is
   resolved by name against the project, described in plain words, applied,
   and undoable. */
import { loadDir, loadFile, saveFile, moveFile } from "../utils/";
import { roleFromKind, ROLES } from "../role";
import { EMPTY_WHEN } from "../time";
import { loadMaps } from "../maps";
import { loadTimelines } from "../timelines";
import { loadTabs, saveTabs } from "../tabs";
import { loadCalendar, saveCalendar, GREGORIAN, CUSTOM_DEFAULT, isCustom } from "../calendar";
import { newMap, updateMap, newPin, deleteMap } from "../maps";
import { newTimeline, updateTimeline, deleteTimeline } from "../timelines";
import { isLocation } from "../role";

export const ACTION_DOCS = `When the author asks you to change the project — make, link, rename, split, merge, move, date or remove things — do it by ending your reply with one fenced block tagged silky-actions holding a JSON array of actions. Say in a sentence what you are doing; keep the block last. Refer to things by their names as the project knows them. Only act when asked, and never remove anything unless the author plainly asks.

Creating something that already exists by that name reuses it rather than making a duplicate, so it is safe to name things you aren't sure about. Maps, timelines, the calendar and tabs are yours to make and change as well.

"Set the timeline" or "date the scenes" means giving scenes times: one set_when per scene (dates you infer from the text, offsets like "3 days after the previous"), or date_thread to space a whole thread evenly; the Timeline view then draws them. "open" only shows something — it sets nothing.

Actions (fields in brackets are optional):
- {"action":"create_element","name":"…","role":"character|location|thing",["description":"…"]}
- {"action":"create_fact","statement":"…",["involves":["element name",…]],["revealed_by":["scene name",…]],["because":["fact statement",…]]}
- {"action":"create_scene","name":"…",["content":"prose, paragraphs separated by blank lines"],["thread":"thread name"],["after":"scene name"]}
- {"action":"create_thread","name":"…",["scenes":["scene name",…]]}
- {"action":"create_web","name":"…",["items":["name",…]]}
- {"action":"link","from":"name","relation":"reveals|involves|causes|sequences|captures","to":"name"}   (scene reveals fact; fact involves element; fact causes fact; thread sequences scene; web captures anything)
- {"action":"unlink","from":"name","relation":"…","to":"name"}
- {"action":"rename","name":"…","to":"…"}
- {"action":"set_role","name":"…","role":"character|location|thing"}
- {"action":"set_description","name":"…","text":"…"}
- {"action":"set_when","scene":"…",["date":"1897-05-03"],["time":"21:30"],["offset":3,"unit":"days"],["duration":2,"durationUnit":"hours"],["note":"…"]}
- {"action":"date_thread","thread":"…","start":"1889-09-25",["every":1,"unit":"days"],["overwrite":false]}   (dates the thread's first scene and spaces the rest 'every' units apart as offsets; scenes that already have a time are kept unless overwrite)
- {"action":"split_scene","scene":"…","at":"the first few words of the paragraph that begins the second part",["newName":"…"]}
- {"action":"merge_scenes","first":"scene name","second":"scene name"}
- {"action":"move_scene","scene":"…","thread":"…",["after":"scene name"|"position":1]}
- {"action":"remove","name":"…"}   (goes to the project's rubbish; only when asked)
- {"action":"open","name":"…"}   (opens a thing in a tab and shows it; also "wiki", "preferences", "progress", "word count", "pacing", "style", "reader", "ai influence", a map's or timeline's name, or "write" for the blank page)
- {"action":"close","name":"…"|"all"|"others"}   (closes that tab, every tab, or every tab but the current one)
- {"action":"merge_elements","keep":"name","remove":"name"}   (fold a duplicate into the one to keep: its facts, scenes, webs and maps move over; the duplicate goes to the rubbish)
- {"action":"create_map","name":"…",["unit":"miles"],["pins":["location name",…]]}   (a blank map in Tools; pins land in a row to be dragged into place)
- {"action":"pin","map":"map name","location":"element name",["x":500,"y":300]}
- {"action":"create_timeline","name":"…",["threads":["thread name",…]]}
- {"action":"set_calendar","mode":"gregorian"}  or  {"action":"set_calendar","mode":"custom",["era":"AE"],["hoursPerDay":24],["months":[{"name":"Frostfall","days":40},…]]}   (the project's calendar; years start at 0; omit months to keep the current ones)
- {"action":"rename_month","month":"old name"|3,"to":"new name",["days":31]}

Example:
I'll add him and tie him to the Hall.
\`\`\`silky-actions
[{"action":"create_element","name":"Perkins","role":"character","description":"The Baskervilles' groom."},
 {"action":"create_fact","statement":"Perkins drives Sir Henry from the station.","involves":["Perkins","Sir Henry Baskerville"],"revealed_by":["Chapter 6 · Baskerville Hall"]}]
\`\`\``;

/* ── parsing ── */
const parseActionsJson = (raw) => {
  const s = String(raw || "").trim();
  const asList = (v) => (Array.isArray(v) ? v : v && Array.isArray(v.actions) ? v.actions : v ? [v] : []);
  try { return { actions: asList(JSON.parse(s)), truncated: false }; } catch (e) { /* fall through */ }
  // the reply was cut off mid-block: keep every complete object we can find
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") { if (depth === 0) start = i; depth += 1; }
    else if (ch === "}") { depth -= 1; if (depth === 0 && start >= 0) { try { out.push(JSON.parse(s.slice(start, i + 1))); } catch (e) { /* skip */ } start = -1; } }
  }
  return { actions: out, truncated: true };
};

/** Pull the actions block out of a reply; a block the reply was cut off inside is salvaged. */
export const extractActions = (reply) => {
  const text = String(reply || "");
  const m = text.match(/```silky-actions\s*([\s\S]*?)(```|$)/i);
  if (!m) return { text, actions: [], truncated: false };
  const { actions, truncated } = parseActionsJson(m[1]);
  const cut = truncated || !m[2];
  return { text: text.replace(m[0], "").trim(), actions: actions.filter((a) => a && typeof a === "object" && a.action), truncated: cut };
};

/* ── opening and closing tabs (needs the router) ── */
const ANALYSIS_NAMES = { progress: "progress", "word count": "wordcount", wordcount: "wordcount", words: "wordcount", pacing: "pacing", style: "style", reader: "reader", readers: "reader", "ai influence": "influence", influence: "influence" };
export const hrefFor = (dir, name) => {
  const n = norm(name);
  if (!n || n === "write" || n === "writing page" || n === "blank page" || n === "home") return { href: "/", label: "the writing page" };
  if (n === "wiki") return { href: "/wiki/home", label: "the wiki" };
  if (n === "preferences" || n === "settings") return { href: "/preferences", label: "Preferences" };
  if (n === "spinner" || n === "talk") return { href: "/spinner", label: "Spinner" };
  if (ANALYSIS_NAMES[n]) return { href: "/analysis/" + ANALYSIS_NAMES[n], label: name };
  const maps = loadMaps(dir).maps, tls = loadTimelines(dir).timelines;
  const m = maps.find((x) => norm(x.name) === n || norm(x.name).includes(n));
  if (m) return { href: "/map/" + m.id, label: m.name };
  const t = tls.find((x) => norm(x.name) === n || norm(x.name).includes(n));
  if (t) return { href: "/timeline/" + t.id, label: t.name };
  // "the map" / "the timeline": the most recent one, if any
  if (/^(the )?maps?$/.test(n) && maps.length) { const last = [...maps].sort((a, b) => (b.updated || 0) - (a.updated || 0))[0]; return { href: "/map/" + last.id, label: last.name }; }
  if (/^(the )?timelines?$/.test(n) && tls.length) { const last = [...tls].sort((a, b) => (b.updated || 0) - (a.updated || 0))[0]; return { href: "/timeline/" + last.id, label: last.name }; }
  const x = find(actorsOf(dir), name);
  if (x) return { href: "/elements/" + x.file, label: `${x.icon || ""} ${x.name}`.trim(), key: x.file };
  return null;
};
const tabKeyFor = (dir, name) => {
  const h = hrefFor(dir, name);
  if (!h) return null;
  if (h.key) return h.key;
  if (h.href === "/wiki/home") return "wiki";
  if (h.href === "/spinner") return "spinner";
  if (h.href === "/preferences") return "preferences";
  if (h.href.startsWith("/analysis/")) return "analysis:" + h.href.slice(10);
  if (h.href.startsWith("/map/")) return "map:" + h.href.slice(5);
  if (h.href.startsWith("/timeline/")) return "timeline:" + h.href.slice(10);
  return null;
};

/* ── resolution ── */
const norm = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const actorsOf = (dir) => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
const find = (actors, name, types) => {
  const n = norm(name);
  if (!n) return null;
  const pool = types ? actors.filter((a) => types.includes(a.type)) : actors;
  return pool.find((a) => norm(a.name) === n)
    || pool.find((a) => norm(a.name).startsWith(n) || n.startsWith(norm(a.name)))
    || pool.find((a) => norm(a.name).includes(n) || n.includes(norm(a.name)))
    || null;
};
const uid = (t) => `${t}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toHtml = (t) => String(t || "").replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
const ROLE_ICON = { character: "🧍", location: "📍", thing: "🔹" };

const REL = {
  reveals: { from: ["snippet"], to: ["fact"], fwd: "reveals", back: "revealed_by" },
  involves: { from: ["fact"], to: ["element"], fwd: "involves", back: "involved_in" },
  causes: { from: ["fact"], to: ["fact"], fwd: "causes", back: "because" },
  sequences: { from: ["thread"], to: ["snippet"], fwd: "sequences", back: "sequenced_in" },
  captures: { from: ["web"], to: ["element", "fact", "snippet", "thread"], fwd: "captures", back: "captured_in" },
};
const relOf = (name, a, b) => {
  const r = REL[name];
  if (r) return r;
  // guess from types
  if (a && b) return Object.values(REL).find((x) => x.from.includes(a.type) && x.to.includes(b.type)) || null;
  return null;
};

/** Plain-words description of what an action will do, with resolution notes. */
export const describeAction = (dir, a) => {
  const actors = actorsOf(dir);
  const miss = (n) => `“${n}” (not found)`;
  const nameOf = (n, types) => { const x = find(actors, n, types); return x ? `${x.icon || ""} ${x.name}`.trim() : miss(n); };
  switch (a.action) {
    case "create_element": return `Create element ${ROLE_ICON[a.role] || "🔹"} ${a.name}${a.role ? ` (${a.role})` : ""}${a.description ? ` — ${a.description}` : ""}`;
    case "create_fact": return `Create fact 💡 ${a.statement}${a.involves && a.involves.length ? ` · involves ${a.involves.map((n) => nameOf(n, ["element"])).join(", ")}` : ""}${a.revealed_by && a.revealed_by.length ? ` · revealed by ${a.revealed_by.map((n) => nameOf(n, ["snippet"])).join(", ")}` : ""}${a.because && a.because.length ? ` · because ${a.because.map((n) => nameOf(n, ["fact"])).join("; ")}` : ""}`;
    case "create_scene": return `Create scene 📜 ${a.name}${a.thread ? ` in ${nameOf(a.thread, ["thread"])}` : ""}${a.after ? ` after ${nameOf(a.after, ["snippet"])}` : ""}${a.content ? ` with ${(String(a.content).match(/\S+/g) || []).length} words` : ""}`;
    case "create_thread": return `Create thread 🧵 ${a.name}${a.scenes && a.scenes.length ? ` with ${a.scenes.map((n) => nameOf(n, ["snippet"])).join(", ")}` : ""}`;
    case "create_web": return `Create web 🕸️ ${a.name}${a.items && a.items.length ? ` capturing ${a.items.map((n) => nameOf(n)).join(", ")}` : ""}`;
    case "link": return `Link: ${nameOf(a.from)} ${a.relation || "→"} ${nameOf(a.to)}`;
    case "unlink": return `Unlink: ${nameOf(a.from)} ${a.relation || "→"} ${nameOf(a.to)}`;
    case "rename": return `Rename ${nameOf(a.name)} to “${a.to}”`;
    case "set_role": return `Make ${nameOf(a.name, ["element"])} a ${a.role}`;
    case "set_description": return `Describe ${nameOf(a.name)}: “${String(a.text || "").slice(0, 80)}${String(a.text || "").length > 80 ? "…" : ""}”`;
    case "set_when": return `Set when for ${nameOf(a.scene, ["snippet"])}: ${[a.date && `on ${a.date}${a.time ? " " + a.time : ""}`, a.offset != null && a.offset !== "" && `${a.offset} ${a.unit || "days"} after the previous`, a.duration != null && a.duration !== "" && `lasts ${a.duration} ${a.durationUnit || "hours"}`, a.note].filter(Boolean).join(", ")}`;
    case "date_thread": return `Date every scene in ${nameOf(a.thread, ["thread"])}: first on ${a.start}, then ${a.every || 1} ${a.unit || "days"} apart${a.overwrite ? " (overwriting existing times)" : " (keeping scenes already timed)"}`;
    case "split_scene": return `Split ${nameOf(a.scene, ["snippet"])} at “${String(a.at || "").slice(0, 50)}…”${a.newName ? ` → new scene “${a.newName}”` : ""}`;
    case "merge_scenes": return `Merge ${nameOf(a.second, ["snippet"])} into ${nameOf(a.first, ["snippet"])}`;
    case "move_scene": return `Move ${nameOf(a.scene, ["snippet"])} in ${nameOf(a.thread, ["thread"])}${a.after ? ` to after ${nameOf(a.after, ["snippet"])}` : a.position != null ? ` to position ${a.position}` : " to the end"}`;
    case "remove": return `Remove ${nameOf(a.name)} (to the rubbish)`;
    case "open": { const h = hrefFor(dir, a.name); return h ? `Open ${h.label}` : `Open ${miss(a.name)}`; }
    case "merge_elements": return `Merge ${nameOf(a.remove)} into ${nameOf(a.keep)} (the first goes to the rubbish)`;
    case "create_map": return `Create map 🗺️ ${a.name}${a.unit ? ` (${a.unit})` : ""}${a.pins && a.pins.length ? ` with pins for ${a.pins.map((n) => nameOf(n, ["element"])).join(", ")}` : ""}`;
    case "pin": return `Pin ${nameOf(a.location, ["element"])} on map “${a.map}”`;
    case "create_timeline": return `Create timeline ${a.name}${a.threads && a.threads.length ? ` with ${a.threads.map((n) => nameOf(n, ["thread"])).join(", ")}` : ""}`;
    case "set_calendar": return a.mode === "gregorian" ? "Use the Gregorian calendar for this project" : `Use a custom calendar${a.era ? ` (era “${a.era}”)` : ""}${a.hoursPerDay ? `, ${a.hoursPerDay}-hour days` : ""}${Array.isArray(a.months) && a.months.length ? `, ${a.months.length} months: ${a.months.map((m) => `${m.name} (${m.days})`).join(", ")}` : ""}`;
    case "rename_month": return `Rename month ${typeof a.month === "number" ? "#" + a.month : `“${a.month}”`} to “${a.to}”${a.days ? `, ${a.days} days` : ""}`;
    case "close": return norm(a.name) === "all" ? "Close every tab" : norm(a.name) === "others" ? "Close the other tabs" : `Close the tab for ${nameOf(a.name)}`;
    default: return `Unknown action “${a.action}”`;
  }
};

/* ── applying ── */
const save = (dir, x) => saveFile(dir + x.file, x);
const existing = (actors, type, name) => actors.find((x) => x.type === type && norm(x.name) === norm(name)) || null;
const mkActor = (type, name, icon, extra) => { const u = uid(type); return { name, file: u + ".element.json", type, icon, order: Date.now(), uuid: u, captured_in: [], origin: "spinner-talk", ...extra }; };

const linkPair = (dir, a, rel, b) => {
  a[rel.fwd] = a[rel.fwd] || []; b[rel.back] = b[rel.back] || [];
  const had = a[rel.fwd].includes(b.file), hadBack = b[rel.back].includes(a.file);
  if (!had) a[rel.fwd].push(b.file);
  if (!hadBack) b[rel.back].push(a.file);
  save(dir, a); save(dir, b);
  return () => {
    const a2 = loadFile(dir + a.file), b2 = loadFile(dir + b.file);
    if (a2 && !had) { a2[rel.fwd] = (a2[rel.fwd] || []).filter((x) => x !== b.file); save(dir, a2); }
    if (b2 && !hadBack) { b2[rel.back] = (b2[rel.back] || []).filter((x) => x !== a.file); save(dir, b2); }
  };
};
const unlinkPair = (dir, a, rel, b) => {
  const had = (a[rel.fwd] || []).includes(b.file), hadBack = (b[rel.back] || []).includes(a.file);
  a[rel.fwd] = (a[rel.fwd] || []).filter((x) => x !== b.file);
  b[rel.back] = (b[rel.back] || []).filter((x) => x !== a.file);
  save(dir, a); save(dir, b);
  return () => { const a2 = loadFile(dir + a.file), b2 = loadFile(dir + b.file); if (a2 && had) { a2[rel.fwd].push(b.file); save(dir, a2); } if (b2 && hadBack) { b2[rel.back].push(a.file); save(dir, b2); } };
};
const captureIn = (dir, web, x) => {
  web.captures = web.captures || [];
  const had = web.captures.some((c) => c.file === x.file);
  if (!had) { const n = web.captures.length; web.captures.push({ file: x.file, x: 300 + (n % 6) * 160, y: 200 + Math.floor(n / 6) * 120 }); }
  x.captured_in = x.captured_in || [];
  const hadBack = x.captured_in.includes(web.file);
  if (!hadBack) x.captured_in.push(web.file);
  save(dir, web); save(dir, x);
  return () => { const w = loadFile(dir + web.file), y = loadFile(dir + x.file); if (w && !had) { w.captures = w.captures.filter((c) => c.file !== x.file); save(dir, w); } if (y && !hadBack) { y.captured_in = y.captured_in.filter((f) => f !== web.file); save(dir, y); } };
};
const binLater = (dir, x) => () => { try { moveFile(dir + x.file, dir + "rubbish/" + x.file); } catch (e) { /* */ } };
const toRubbish = (dir, x) => {
  try { moveFile(dir + x.file, dir + "rubbish/" + x.file); } catch (e) { /* no rubbish dir */ }
  return () => { try { moveFile(dir + "rubbish/" + x.file, dir + x.file); } catch (e) { /* */ } };
};

/**
 * Apply one action. Returns { ok, message, undo } — undo reverses it.
 */
export const applyAction = (dir, a, ctx = {}) => {
  const actors = actorsOf(dir);
  const need = (n, types, what) => { const x = find(actors, n, types); if (!x) throw new Error(`Can't find ${what || "that"}: “${n}”`); return x; };
  const undos = [];
  const done = (message) => ({ ok: true, message, undo: () => { undos.reverse().forEach((u) => { try { u(); } catch (e) { /* */ } }); } });
  try {
    switch (a.action) {
      case "create_element": {
        const dup = existing(actors, "element", a.name);
        if (dup) {
          const changed = [];
          if (a.role && ROLES.some((r) => r.id === a.role) && dup.role !== a.role) { const was = dup.role; dup.role = a.role; changed.push(() => { const y = loadFile(dir + dup.file); if (y) { y.role = was; save(dir, y); } }); }
          if (a.description && !String(dup.content || "").replace(/<[^>]+>/g, "").trim()) { const was = dup.content; dup.content = toHtml(a.description); changed.push(() => { const y = loadFile(dir + dup.file); if (y) { y.content = was; save(dir, y); } }); }
          if (changed.length) { save(dir, dup); undos.push(...changed); }
          return done(`${dup.icon} ${dup.name} already existed — reused it${changed.length ? " and filled in what was missing" : ""}`);
        }
        const role = ROLES.some((r) => r.id === a.role) ? a.role : roleFromKind(a.role);
        const el = mkActor("element", String(a.name).trim(), ROLE_ICON[role] || "🔹", { content: a.description ? toHtml(a.description) : " ", involved_in: [], role, kind: role === "character" ? "person" : role === "location" ? "place" : "thing" });
        save(dir, el); undos.push(binLater(dir, el));
        return done(`Created ${el.icon} ${el.name}`);
      }
      case "create_fact": {
        const dupF = existing(actors, "fact", a.statement);
        if (dupF) {
          (a.revealed_by || []).forEach((n) => { const sc = find(actors, n, ["snippet"]); if (sc && !(sc.reveals || []).includes(dupF.file)) undos.push(linkPair(dir, sc, REL.reveals, loadFile(dir + dupF.file))); });
          (a.involves || []).forEach((n) => { const e = find(actors, n, ["element"]); if (e && !(dupF.involves || []).includes(e.file)) undos.push(linkPair(dir, loadFile(dir + dupF.file), REL.involves, e)); });
          return done(`💡 ${dupF.name} already existed — reused it`);
        }
        const f = mkActor("fact", String(a.statement).trim(), "💡", { content: [], causes: [], because: [], involves: [], revealed_by: [] });
        save(dir, f); undos.push(binLater(dir, f));
        (a.involves || []).forEach((n) => { const e = find(actors, n, ["element"]); if (e) undos.push(linkPair(dir, loadFile(dir + f.file), REL.involves, e)); });
        (a.revealed_by || []).forEach((n) => { const s = find(actors, n, ["snippet"]); if (s) undos.push(linkPair(dir, s, REL.reveals, loadFile(dir + f.file))); });
        (a.because || []).forEach((n) => { const c = find(actors, n, ["fact"]); if (c) undos.push(linkPair(dir, c, REL.causes, loadFile(dir + f.file))); });
        return done(`Created 💡 ${f.name}`);
      }
      case "create_scene": {
        const dupS = existing(actors, "snippet", a.name);
        if (dupS) return done(`📜 ${dupS.name} already exists — left as it is`);
        const s = mkActor("snippet", String(a.name).trim(), "📜", { content: a.content ? toHtml(a.content) : "", reveals: [], sequenced_in: [] });
        save(dir, s); undos.push(binLater(dir, s));
        let t = a.thread ? find(actors, a.thread, ["thread"]) : null;
        if (!t && a.after) { const after = find(actors, a.after, ["snippet"]); t = after && after.sequenced_in && after.sequenced_in.length ? loadFile(dir + after.sequenced_in[0]) : null; }
        if (!t && !a.thread) t = actors.find((x) => x.type === "thread" && x.name === "Manuscript") || null;
        if (t) {
          t = loadFile(dir + t.file);
          const after = a.after ? find(actors, a.after, ["snippet"]) : null;
          const i = after ? t.sequences.indexOf(after.file) : -1;
          const before = [...t.sequences];
          if (i >= 0) t.sequences.splice(i + 1, 0, s.file); else t.sequences.push(s.file);
          const s2 = loadFile(dir + s.file); s2.sequenced_in = [t.file]; save(dir, s2); save(dir, t);
          const tf = t.file;
          undos.push(() => { const t2 = loadFile(dir + tf); if (t2) { t2.sequences = before; save(dir, t2); } });
        }
        return done(`Created 📜 ${s.name}${t ? ` in ${t.name}` : ""}`);
      }
      case "create_thread": {
        const dupT = existing(actors, "thread", a.name);
        if (dupT) {
          (a.scenes || []).forEach((n) => { const sc = find(actors, n, ["snippet"]); if (sc && !dupT.sequences.includes(sc.file)) undos.push(linkPair(dir, loadFile(dir + dupT.file), REL.sequences, loadFile(dir + sc.file))); });
          return done(`🧵 ${dupT.name} already existed — reused it`);
        }
        const t = mkActor("thread", String(a.name).trim(), "🧵", { content: "", sequences: [] });
        save(dir, t); undos.push(binLater(dir, t));
        (a.scenes || []).forEach((n) => { const s = find(actors, n, ["snippet"]); if (s) undos.push(linkPair(dir, loadFile(dir + t.file), REL.sequences, loadFile(dir + s.file))); });
        return done(`Created 🧵 ${t.name}`);
      }
      case "create_web": {
        const dupW = existing(actors, "web", a.name);
        if (dupW) {
          (a.items || []).forEach((n) => { const x = find(actors, n); if (x) undos.push(captureIn(dir, loadFile(dir + dupW.file), loadFile(dir + x.file))); });
          return done(`🕸️ ${dupW.name} already existed — reused it`);
        }
        const w = mkActor("web", String(a.name).trim(), "🕸️", { captures: [], expands: ["reveals", "because", "involves", "then"] });
        save(dir, w); undos.push(binLater(dir, w));
        (a.items || []).forEach((n) => { const x = find(actors, n); if (x) undos.push(captureIn(dir, loadFile(dir + w.file), loadFile(dir + x.file))); });
        return done(`Created 🕸️ ${w.name}`);
      }
      case "link": case "unlink": {
        let from = find(actors, a.from), to = find(actors, a.to);
        let rel = relOf(a.relation, from, to);
        if (rel && from && !rel.from.includes(from.type) && rel.to.includes(from.type) && to && rel.from.includes(to.type)) { const t = from; from = to; to = t; }
        if (!from) throw new Error(`Can't find “${a.from}”`);
        if (!to) throw new Error(`Can't find “${a.to}”`);
        if (!rel) throw new Error(`No relation fits ${from.type} → ${to.type}`);
        if (rel === REL.captures) { if (a.action === "link") undos.push(captureIn(dir, from, to)); else throw new Error("Remove from a web on the web's page."); }
        else undos.push((a.action === "link" ? linkPair : unlinkPair)(dir, from, rel, to));
        return done(`${a.action === "link" ? "Linked" : "Unlinked"} ${from.name} ${rel.fwd} ${to.name}`);
      }
      case "rename": {
        const x = need(a.name); const was = x.name; x.name = String(a.to).trim(); save(dir, x);
        undos.push(() => { const y = loadFile(dir + x.file); if (y) { y.name = was; save(dir, y); } });
        return done(`Renamed “${was}” to “${x.name}”`);
      }
      case "set_role": {
        const x = need(a.name, ["element"], "an element"); const was = x.role; x.role = a.role; save(dir, x);
        undos.push(() => { const y = loadFile(dir + x.file); if (y) { y.role = was; save(dir, y); } });
        return done(`${x.name} is now a ${a.role}`);
      }
      case "set_description": {
        const x = need(a.name); const was = x.content; x.content = toHtml(a.text); save(dir, x);
        undos.push(() => { const y = loadFile(dir + x.file); if (y) { y.content = was; save(dir, y); } });
        return done(`Described ${x.name}`);
      }
      case "set_when": {
        const s = need(a.scene, ["snippet"], "a scene"); const was = s.when;
        const w = { ...EMPTY_WHEN, ...(s.when || {}) };
        if (a.date != null) { w.date = String(a.date); w.relValue = ""; }
        if (a.time != null) w.time = String(a.time);
        if (a.offset != null && a.offset !== "") { w.relValue = String(a.offset); w.relUnit = a.unit || w.relUnit; w.date = ""; }
        if (a.duration != null && a.duration !== "") { w.durationValue = String(a.duration); w.durationUnit = a.durationUnit || w.durationUnit; }
        if (a.note != null) w.note = String(a.note);
        s.when = w; save(dir, s);
        undos.push(() => { const y = loadFile(dir + s.file); if (y) { y.when = was; save(dir, y); } });
        return done(`Set when for ${s.name}`);
      }
      case "date_thread": {
        const t = need(a.thread, ["thread"], "a thread");
        const scenes = t.sequences.map((f) => loadFile(dir + f)).filter((x) => x && x.type === "snippet");
        if (!scenes.length) throw new Error(`${t.name} has no scenes.`);
        const befores = scenes.map((x) => [x.file, x.when]);
        let n = 0;
        scenes.forEach((x, i) => {
          const has = x.when && (x.when.date || x.when.relValue);
          if (has && !a.overwrite) return;
          const w = { ...EMPTY_WHEN, ...(x.when || {}) };
          if (i === 0) { w.date = String(a.start); w.relValue = ""; }
          else { w.date = ""; w.relValue = String(a.every != null ? a.every : 1); w.relUnit = a.unit || "days"; }
          x.when = w; save(dir, x); n += 1;
        });
        undos.push(() => befores.forEach(([f, w]) => { const y = loadFile(dir + f); if (y) { y.when = w; save(dir, y); } }));
        return done(`Dated ${n} scene${n === 1 ? "" : "s"} in ${t.name}`);
      }
      case "split_scene": {
        const s = need(a.scene, ["snippet"], "a scene");
        const body = new DOMParser().parseFromString(`<body>${s.content || ""}</body>`, "text/html").body;
        const blocks = [...body.children];
        const key = norm(a.at).split(" ").slice(0, 6).join(" ");
        const idx = blocks.findIndex((b) => norm(b.textContent).startsWith(key)) >= 0 ? blocks.findIndex((b) => norm(b.textContent).startsWith(key)) : blocks.findIndex((b) => norm(b.textContent).includes(key));
        if (idx <= 0) throw new Error(`Couldn't find a paragraph starting “${String(a.at).slice(0, 40)}” in ${s.name} (or it's the first one).`);
        const wasContent = s.content;
        const first = blocks.slice(0, idx).map((b) => b.outerHTML).join("");
        const second = blocks.slice(idx).map((b) => b.outerHTML).join("");
        const s2 = mkActor("snippet", a.newName ? String(a.newName).trim() : `${s.name} (2)`, s.icon || "📜", { content: second, reveals: [], sequenced_in: [...(s.sequenced_in || [])] });
        s.content = first; save(dir, s); save(dir, s2);
        const threadUndos = [];
        (s.sequenced_in || []).forEach((tf) => { const t = loadFile(dir + tf); if (!t) return; const before = [...t.sequences]; const i = t.sequences.indexOf(s.file); t.sequences.splice(i + 1, 0, s2.file); save(dir, t); threadUndos.push(() => { const t2 = loadFile(dir + tf); if (t2) { t2.sequences = before; save(dir, t2); } }); });
        undos.push(() => { threadUndos.forEach((u) => u()); binLater(dir, s2)(); const y = loadFile(dir + s.file); if (y) { y.content = wasContent; save(dir, y); } });
        return done(`Split ${s.name}; the rest is now “${s2.name}”`);
      }
      case "merge_scenes": {
        const first = need(a.first, ["snippet"], "a scene"), second = need(a.second, ["snippet"], "a scene");
        if (first.file === second.file) throw new Error("Those are the same scene.");
        const wasContent = first.content, wasReveals = [...(first.reveals || [])];
        first.content = (first.content || "") + (second.content || "");
        (second.reveals || []).forEach((f) => { if (!first.reveals.includes(f)) first.reveals.push(f); });
        save(dir, first);
        const revealUndos = [];
        (second.reveals || []).forEach((ff) => { const f = loadFile(dir + ff); if (f) { const had = (f.revealed_by || []).includes(first.file); if (!had) { f.revealed_by = [...(f.revealed_by || []), first.file]; save(dir, f); revealUndos.push(() => { const g = loadFile(dir + ff); if (g) { g.revealed_by = g.revealed_by.filter((x) => x !== first.file); save(dir, g); } }); } } });
        const threadUndos = [];
        (second.sequenced_in || []).forEach((tf) => { const t = loadFile(dir + tf); if (!t) return; const before = [...t.sequences]; t.sequences = t.sequences.filter((x) => x !== second.file); save(dir, t); threadUndos.push(() => { const t2 = loadFile(dir + tf); if (t2) { t2.sequences = before; save(dir, t2); } }); });
        const back = toRubbish(dir, second);
        undos.push(() => { back(); threadUndos.forEach((u) => u()); revealUndos.forEach((u) => u()); const y = loadFile(dir + first.file); if (y) { y.content = wasContent; y.reveals = wasReveals; save(dir, y); } });
        return done(`Merged ${second.name} into ${first.name}`);
      }
      case "move_scene": {
        const s = need(a.scene, ["snippet"], "a scene"); const t = need(a.thread, ["thread"], "a thread");
        const before = [...t.sequences]; const seqBefore = [...(s.sequenced_in || [])];
        t.sequences = t.sequences.filter((x) => x !== s.file);
        let at = t.sequences.length;
        if (a.after) { const af = find(actors, a.after, ["snippet"]); if (af) at = t.sequences.indexOf(af.file) + 1; }
        else if (a.position != null) at = Math.max(0, Math.min(t.sequences.length, Number(a.position) - 1));
        t.sequences.splice(at, 0, s.file); save(dir, t);
        if (!(s.sequenced_in || []).includes(t.file)) { s.sequenced_in = [...(s.sequenced_in || []), t.file]; save(dir, s); }
        undos.push(() => { const t2 = loadFile(dir + t.file); if (t2) { t2.sequences = before; save(dir, t2); } const y = loadFile(dir + s.file); if (y) { y.sequenced_in = seqBefore; save(dir, y); } });
        return done(`Moved ${s.name} in ${t.name}`);
      }
      case "remove": {
        const x = need(a.name);
        undos.push(toRubbish(dir, x));
        return done(`Removed ${x.name} (it's in the rubbish)`);
      }
      case "merge_elements": {
        const keep = need(a.keep, ["element"], "an element"), gone = need(a.remove, ["element"], "an element");
        if (keep.file === gone.file) throw new Error("Those are the same element.");
        const touched = [];
        actors.forEach((x) => {
          let changed = false;
          const swap = (arr) => { if (!Array.isArray(arr) || !arr.includes(gone.file)) return arr; changed = true; const out = arr.filter((f) => f !== gone.file); if (!out.includes(keep.file)) out.push(keep.file); return out; };
          if (x.type === "fact") x.involves = swap(x.involves);
          if (x.type === "web" && Array.isArray(x.captures) && x.captures.some((c) => c.file === gone.file)) { changed = true; const hasKeep = x.captures.some((c) => c.file === keep.file); x.captures = x.captures.filter((c) => c.file !== gone.file).concat(hasKeep ? [] : [{ file: keep.file, x: 300, y: 300 }]); }
          if (changed) { const before = loadFile(dir + x.file); save(dir, x); touched.push(() => save(dir, before)); }
        });
        const k2 = loadFile(dir + keep.file);
        const kBefore = loadFile(dir + keep.file);
        k2.involved_in = [...new Set([...(k2.involved_in || []), ...(gone.involved_in || [])])];
        k2.captured_in = [...new Set([...(k2.captured_in || []), ...(gone.captured_in || [])])];
        if (!String(k2.content || "").replace(/<[^>]+>/g, "").trim() && gone.content) k2.content = gone.content;
        save(dir, k2);
        const maps = loadMaps(dir).maps;
        maps.forEach((m) => { if (m.pins.some((p) => p.element === gone.file)) { const before = JSON.parse(JSON.stringify(m)); updateMap(dir, { ...m, pins: m.pins.map((p) => (p.element === gone.file ? { ...p, element: keep.file } : p)) }); touched.push(() => updateMap(dir, before)); } });
        const back = toRubbish(dir, gone);
        undos.push(() => { back(); touched.reverse().forEach((u) => u()); save(dir, kBefore); });
        return done(`Merged ${gone.name} into ${keep.name}`);
      }
      case "create_map": {
        const have = loadMaps(dir).maps.find((m) => norm(m.name) === norm(a.name));
        const m = have || newMap(dir, String(a.name).trim());
        const pins = [...m.pins];
        (a.pins || []).forEach((n, i) => { const e = find(actors, n, ["element"]); if (e && !pins.some((p) => p.element === e.file)) pins.push(newPin(300 + (pins.length % 6) * 220, 300 + Math.floor(pins.length / 6) * 180, { element: e.file })); });
        updateMap(dir, { ...m, unit: a.unit || m.unit, pins });
        const mid = m.id;
        undos.push(() => { if (have) updateMap(dir, have); else deleteMap(dir, mid); });
        return done(`${have ? "Updated" : "Created"} map “${m.name}”${pins.length > m.pins.length ? ` with ${pins.length - m.pins.length} pin${pins.length - m.pins.length === 1 ? "" : "s"} to drag into place` : ""}`);
      }
      case "pin": {
        const m = loadMaps(dir).maps.find((x) => norm(x.name) === norm(a.map) || norm(x.name).includes(norm(a.map)));
        if (!m) throw new Error(`No map called “${a.map}”`);
        const e = need(a.location, ["element"], "a location");
        if (!isLocation(e)) { const was = e.role; e.role = "location"; save(dir, e); undos.push(() => { const y = loadFile(dir + e.file); if (y) { y.role = was; save(dir, y); } }); }
        if (m.pins.some((p) => p.element === e.file)) return done(`${e.name} is already pinned on ${m.name}`);
        const before = JSON.parse(JSON.stringify(m));
        updateMap(dir, { ...m, pins: [...m.pins, newPin(Number.isFinite(Number(a.x)) ? Number(a.x) : 300 + (m.pins.length % 6) * 220, Number.isFinite(Number(a.y)) ? Number(a.y) : 300 + Math.floor(m.pins.length / 6) * 180, { element: e.file })] });
        undos.push(() => updateMap(dir, before));
        return done(`Pinned ${e.name} on ${m.name}`);
      }
      case "create_timeline": {
        const threads = (a.threads || []).map((n) => find(actors, n, ["thread"])).filter(Boolean).map((t) => t.file);
        const have = loadTimelines(dir).timelines.find((t) => norm(t.name) === norm(a.name));
        if (have) { const before = { ...have }; updateTimeline(dir, { ...have, threads: [...new Set([...have.threads, ...threads])] }); undos.push(() => updateTimeline(dir, before)); return done(`Updated timeline “${have.name}”`); }
        const t = newTimeline(dir, String(a.name).trim(), threads.length ? threads : (actors.find((x) => x.type === "thread" && x.name === "Manuscript") ? [actors.find((x) => x.type === "thread" && x.name === "Manuscript").file] : []));
        const tid = t.id;
        undos.push(() => deleteTimeline(dir, tid));
        return done(`Created timeline “${t.name}”`);
      }
      case "set_calendar": {
        const was = loadCalendar(dir);
        let next;
        if (a.mode === "gregorian") next = GREGORIAN;
        else {
          const base = isCustom(was) ? was : CUSTOM_DEFAULT;
          const months = Array.isArray(a.months) && a.months.length ? a.months.map((m, i) => ({ name: String((m && m.name) || `Month ${i + 1}`), days: Math.max(1, Number((m && m.days) || 30)) })) : base.months;
          next = { ...base, mode: "custom", era: a.era != null ? String(a.era) : base.era || "", hoursPerDay: a.hoursPerDay ? Math.max(1, Number(a.hoursPerDay)) : base.hoursPerDay, months };
        }
        saveCalendar(dir, next);
        undos.push(() => saveCalendar(dir, was));
        return done(next.mode === "gregorian" ? "Calendar is Gregorian again" : `Calendar set: ${next.months.length} months, ${next.months.reduce((n, m) => n + m.days, 0)}-day year${next.era ? `, era ${next.era}` : ""}`);
      }
      case "rename_month": {
        const was = loadCalendar(dir);
        if (!isCustom(was)) throw new Error("The project is on the Gregorian calendar; set a custom one first.");
        const idx = typeof a.month === "number" ? a.month - 1 : was.months.findIndex((m) => norm(m.name) === norm(a.month) || norm(m.name).startsWith(norm(a.month)));
        if (idx < 0 || idx >= was.months.length) throw new Error(`No month “${a.month}”`);
        const months = was.months.map((m, i) => (i === idx ? { ...m, name: a.to ? String(a.to) : m.name, days: a.days ? Math.max(1, Number(a.days)) : m.days } : m));
        saveCalendar(dir, { ...was, months });
        undos.push(() => saveCalendar(dir, was));
        return done(`Month ${idx + 1} is now ${months[idx].name} (${months[idx].days} days)`);
      }
      case "open": {
        let h = hrefFor(dir, a.name);
        const n = norm(a.name);
        // "open the timeline" with none yet: make one, like the + button would
        if (!h && /^(the |a |new )?timelines?$/.test(n)) { const manu = actors.find((x) => x.type === "thread" && x.name === "Manuscript"); const t = newTimeline(dir, "Timeline 1", manu ? [manu.file] : []); undos.push(() => deleteTimeline(dir, t.id)); h = { href: "/timeline/" + t.id, label: `a new timeline, “${t.name}”` }; }
        if (!h && /^(the |a |new )?maps?$/.test(n)) { const m = newMap(dir, "Map 1"); undos.push(() => deleteMap(dir, m.id)); h = { href: "/map/" + m.id, label: `a new map, “${m.name}”` }; }
        if (!h) throw new Error(`Can't find anything called “${a.name}”`);
        if (ctx.navigate) ctx.navigate(h.href);
        return done(`Opened ${h.label}`);
      }
      case "close": {
        const project = ctx.project || "";
        const tabs = loadTabs(project);
        const cur = ctx.currentTab || null;
        const n = norm(a.name);
        let next;
        if (n === "all") next = [];
        else if (n === "others") next = cur ? [cur] : [];
        else { const k = tabKeyFor(dir, a.name); if (!k) throw new Error(`No tab for “${a.name}”`); next = tabs.filter((t) => t !== k); if (next.length === tabs.length) throw new Error(`“${a.name}” isn't open`); }
        saveTabs(project, next, true);
        if (ctx.navigate && (n === "all" || (n !== "others" && cur && !next.includes(cur)))) ctx.navigate("/");
        return { ok: true, message: n === "all" ? "Closed every tab" : n === "others" ? "Closed the other tabs" : `Closed ${a.name}`, undo: () => saveTabs(project, tabs, true) };
      }
      default: throw new Error(`Unknown action “${a.action}”`);
    }
  } catch (e) {
    undos.reverse().forEach((u) => { try { u(); } catch (err) { /* */ } });
    return { ok: false, message: e.message || String(e), undo: null };
  }
};
