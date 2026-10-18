/* Small, reversible edits to the model that Flow mode (and anything else)
   can make on the writer's behalf. Every function returns an undo. */
import { loadDir, loadFile, saveFile, moveFile } from "../utils/";
import { roleFromKind } from "../role";

const actors = (dir) => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean);
const save = (dir, a) => saveFile(dir + a.file, a);
const uid = (t) => `${t}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const KIND_ICON = { person: "🧍", place: "📍", thing: "🔹", group: "👥", idea: "💭" };

/** Scene reveals fact. */
export const linkFact = (dir, sceneFile, factFile) => {
  const s = loadFile(dir + sceneFile), f = loadFile(dir + factFile);
  if (!s || !f) return () => {};
  const had = s.reveals.includes(f.file);
  if (!had) s.reveals.push(f.file);
  f.revealed_by = f.revealed_by || [];
  const hadBack = f.revealed_by.includes(s.file);
  if (!hadBack) f.revealed_by.push(s.file);
  save(dir, s); save(dir, f);
  return () => {
    const s2 = loadFile(dir + sceneFile), f2 = loadFile(dir + factFile);
    if (s2 && !had) { s2.reveals = s2.reveals.filter((x) => x !== factFile); save(dir, s2); }
    if (f2 && !hadBack) { f2.revealed_by = (f2.revealed_by || []).filter((x) => x !== sceneFile); save(dir, f2); }
  };
};

/** A new element. */
export const createElement = (dir, { name, kind, icon, description }, origin = "spinner-flow") => {
  const uuid = uid("element");
  const a = { name, file: uuid + ".element.json", type: "element", icon: icon || KIND_ICON[kind] || "🔹", order: Date.now(), uuid, content: description ? `<p>${description}</p>` : " ", involved_in: [], captured_in: [], origin, kind: kind || "thing", role: roleFromKind(kind) };
  save(dir, a);
  const undo = () => {
    const all = actors(dir);
    all.forEach((x) => {
      if (x.type === "fact" && (x.involves || []).includes(a.file)) { x.involves = x.involves.filter((y) => y !== a.file); save(dir, x); }
    });
    try { moveFile(dir + a.file, dir + "rubbish/" + a.file); } catch (e) { /* no rubbish dir */ }
  };
  return { actor: a, undo };
};

/** A new fact revealed by the scene, involving named elements (created if asked). */
export const createFact = (dir, sceneFile, { statement, involves = [] }, { createMissing = false, origin = "spinner-flow" } = {}) => {
  const all = actors(dir);
  const s = loadFile(dir + sceneFile);
  if (!s) return null;
  const uuid = uid("fact");
  const f = { name: statement, file: uuid + ".element.json", type: "fact", icon: "💡", order: Date.now(), uuid, content: [], causes: [], because: [], involves: [], revealed_by: [s.file], captured_in: [], origin };
  const touched = [];
  const made = [];
  involves.forEach((n) => {
    let e = all.find((a) => a.type === "element" && a.name.toLowerCase() === String(n).toLowerCase());
    if (!e && createMissing) { e = createElement(dir, { name: String(n) }, origin).actor; made.push(e); }
    if (e) { f.involves.push(e.file); e.involved_in = e.involved_in || []; if (!e.involved_in.includes(f.file)) e.involved_in.push(f.file); save(dir, e); touched.push(e.file); }
  });
  s.reveals.push(f.file);
  save(dir, f); save(dir, s);
  const undo = () => {
    const s2 = loadFile(dir + sceneFile);
    if (s2) { s2.reveals = s2.reveals.filter((x) => x !== f.file); save(dir, s2); }
    touched.forEach((ef) => { const e = loadFile(dir + ef); if (e) { e.involved_in = (e.involved_in || []).filter((x) => x !== f.file); save(dir, e); } });
    try { moveFile(dir + f.file, dir + "rubbish/" + f.file); made.forEach((e) => moveFile(dir + e.file, dir + "rubbish/" + e.file)); } catch (e) { /* ignore */ }
  };
  return { actor: f, made, undo };
};
