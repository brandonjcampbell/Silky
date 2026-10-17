/* "Reader" analysis: a model reads each scene as a first-time reader and
   says how it landed. Results are saved in the project as a plain JSON file
   (not an actor, so it never shows in the lists). */
import { complete } from "../llm/client";
import { existsSync, readFileSync, writeFileSync } from "../storage";
import { plain } from "./text";

const FILE = "analysis.reader.json";

/** Readers the model can play. Each gets its own notes and letter. */
export const READERS = [
  { id: "first-time", name: "First-time reader", icon: "📖", blurb: "Attentive, open-minded, reading for the story.",
    persona: "an attentive first-time reader of this novel, reading for pleasure with no agenda, who notices when the story grips and when it lets go" },
  { id: "impatient", name: "Impatient commuter", icon: "🚆", blurb: "Reads on the train. Skims. Puts books down.",
    persona: "a busy commuter reading on a crowded train, who skims anything that feels like throat-clearing, loses patience with description and backstory, and will abandon a book that does not keep moving — you say plainly where you would have stopped" },
  { id: "genre", name: "Genre devotee", icon: "🧛", blurb: "Has read everything in this genre. Knows the tropes.",
    persona: "a devoted reader of this book's genre who has read hundreds like it, knows every trope and convention, spots the familiar move a page early, and lights up at a genuine turn or a rule bent well" },
  { id: "critic", name: "Literary critic", icon: "🖋️", blurb: "Reads for sentence, image, structure, theme.",
    persona: "a literary critic reading for the sentence and the structure: voice, image, point of view, what the book is about underneath what happens, and whether the prose earns its effects — exacting but fair" },
  { id: "editor", name: "Acquiring editor", icon: "🏢", blurb: "Could I sell this? Where would I cut?",
    persona: "an acquiring editor at a publishing house reading a submission, asking whether this would sell and to whom, where the market hook is, what you would cut or move, and whether you would ask for the full manuscript" },
  { id: "young", name: "Teen reader", icon: "🎧", blurb: "Sixteen, reads a lot, no patience for being talked down to.",
    persona: "a sixteen-year-old who reads constantly, cares most about characters they can feel for and about honesty of emotion, hates being talked down to or lectured, and says so in your own voice" },
  { id: "continuity", name: "Continuity nitpicker", icon: "🔍", blurb: "Tracks every detail. Catches contradictions.",
    persona: "a meticulous reader who tracks every name, date, place and object across scenes and flags anything that contradicts what came before, anything unexplained, and any question the book seems to have forgotten it raised" },
  { id: "aloud", name: "Reads aloud", icon: "🎙️", blurb: "Hears the prose. Trips on clunky sentences.",
    persona: "someone reading the book aloud to a partner each night, who hears every sentence, trips over clumsy rhythm, repeated words and tangled clauses, and knows which passages made the listener lean in" },
];

/* A reader's profile: the free-text persona plus structured traits that are
   folded into the prompt. Presets can be edited per project (stored as
   overrides) and reset; custom readers are stored whole. */
export const EMPTY_PROFILE = { reads: "", cares: "", loses: "", hopes: "", patience: 3, strictness: 3 };

const PATIENCE = ["You give up on a scene the moment it slows.", "You have little patience for anything that does not move the story.", "", "You will stay with a slow passage if the writing rewards it.", "You savour slowness and are happy to dwell."];
const STRICT = ["You are generous: a scene has to fail badly before you score it below 3.", "You are easy to please and quick to say so.", "", "You are hard to impress; 4 and 5 are reserved for scenes you would reread.", "You are severe: most published fiction would get a 2 or 3 from you, and you say exactly why."];

/** The full text the model is told it is. */
export const personaText = (r) => {
  const p = { ...EMPTY_PROFILE, ...(r.profile || {}) };
  const parts = [r.persona.trim().replace(/\.$/, "")];
  if (p.reads.trim()) parts.push(`You mostly read ${p.reads.trim().replace(/\.$/, "")}`);
  if (p.cares.trim()) parts.push(`What you care about most in a book: ${p.cares.trim().replace(/\.$/, "")}`);
  if (p.loses.trim()) parts.push(`What loses you: ${p.loses.trim().replace(/\.$/, "")}`);
  if (p.hopes.trim()) parts.push(`What you are hoping this book will give you: ${p.hopes.trim().replace(/\.$/, "")}`);
  const pat = PATIENCE[Math.max(0, Math.min(4, Number(p.patience) - 1))];
  const str = STRICT[Math.max(0, Math.min(4, Number(p.strictness) - 1))];
  if (pat) parts.push(pat.replace(/\.$/, ""));
  if (str) parts.push(str.replace(/\.$/, ""));
  return parts.join(". ") + ".";
};

const applyOverride = (preset, data) => {
  const o = data && data.overrides && data.overrides[preset.id];
  return o ? { ...preset, ...o, id: preset.id, preset: true, edited: true } : { ...preset, preset: true };
};

/** All readers available for a project: presets (with any edits) plus custom ones. */
export const allReaders = (data) => [
  ...READERS.map((r) => applyOverride(r, data)).filter((r) => !r.hidden),
  ...((data && data.custom) || []),
];

export const readerById = (id, data) =>
  (READERS.some((r) => r.id === id) ? applyOverride(READERS.find((r) => r.id === id), data) : null) ||
  (data && data.custom && data.custom.find((r) => r.id === id)) ||
  null;

const empty = () => ({ version: 2, readers: {}, custom: [], overrides: {} });

export const loadReader = (dir) => {
  try {
    if (existsSync(dir + FILE)) {
      const d = JSON.parse(readFileSync(dir + FILE));
      // v1 held a single anonymous reader; fold it into "first-time"
      if (!d.version) return { ...empty(), readers: { "first-time": { scenes: d.scenes || {}, overall: d.overall || null } } };
      return { ...empty(), ...d };
    }
  } catch (e) {
    /* corrupt or missing */
  }
  return empty();
};

export const saveReader = (dir, data) => writeFileSync(dir + FILE, JSON.stringify(data));

const clean = ({ name, icon, persona, blurb, profile }) => ({
  name: String(name || "").trim(),
  icon: String(icon || "🙂").trim() || "🙂",
  persona: String(persona || "").trim(),
  blurb: String(blurb || "").trim() || String(persona || "").trim().slice(0, 80),
  profile: { ...EMPTY_PROFILE, ...(profile || {}) },
});

export const addCustomReader = (dir, fields) => {
  const data = loadReader(dir);
  const id = "custom-" + Date.now().toString(36);
  data.custom.push({ id, ...clean(fields), custom: true });
  saveReader(dir, data);
  return id;
};

/** Edit any reader. A preset becomes an override; a custom one is replaced. */
export const updateReader = (dir, id, fields) => {
  const data = loadReader(dir);
  if (READERS.some((r) => r.id === id)) {
    data.overrides = data.overrides || {};
    data.overrides[id] = { ...(data.overrides[id] || {}), ...clean(fields) };
  } else {
    data.custom = data.custom.map((r) => (r.id === id ? { ...r, ...clean(fields) } : r));
  }
  saveReader(dir, data);
};

/** Drop a preset's edits (and un-hide it). */
export const resetReader = (dir, id) => {
  const data = loadReader(dir);
  if (data.overrides) delete data.overrides[id];
  saveReader(dir, data);
};

/** Hide a preset from this project's row (its notes stay). */
export const hideReader = (dir, id) => {
  const data = loadReader(dir);
  data.overrides = data.overrides || {};
  data.overrides[id] = { ...(data.overrides[id] || {}), hidden: true };
  saveReader(dir, data);
};

export const unhideAll = (dir) => {
  const data = loadReader(dir);
  Object.values(data.overrides || {}).forEach((o) => { delete o.hidden; });
  saveReader(dir, data);
};

/** Copy a reader (preset or custom) into a new custom one. */
export const duplicateReader = (dir, id) => {
  const data = loadReader(dir);
  const src = readerById(id, data);
  if (!src) return null;
  const nid = "custom-" + Date.now().toString(36);
  data.custom.push({ id: nid, ...clean({ ...src, name: src.name + " (copy)" }), custom: true });
  saveReader(dir, data);
  return nid;
};

export const removeReader = (dir, id) => {
  const data = loadReader(dir);
  delete data.readers[id];
  data.custom = data.custom.filter((r) => r.id !== id);
  saveReader(dir, data);
};

const sceneSystem = (persona) => `You are ${persona}. You are giving the author candid notes on a novel in progress. You have read the earlier scenes (summarised) and are now reading the next one. Stay in character throughout — your tastes, your patience, your blind spots. Be specific; praise only what earns it. Write in the first person as this reader ("I lost the thread when…"), not as an editor issuing rules.`;

const sceneUser = (scene, i, total, priorNotes) => `Earlier scenes, as I experienced them:
${priorNotes.length ? priorNotes.map((n) => `- ${n}`).join("\n") : "(this is the first scene)"}

Scene ${i + 1} of ${total}${scene.name ? `: ${scene.name}` : ""}
"""
${scene.text}
"""

Return JSON:
{
  "engagement": <1-5, how much I wanted to keep reading>,
  "clarity": <1-5, how easily I followed what was happening>,
  "pace": "slow" | "steady" | "brisk" | "rushed",
  "reaction": "2-3 sentences: what I felt, what landed, what didn't",
  "questions": ["a question or confusion I was left with", "..."],
  "memorable": "one phrase or image from the scene I will remember, quoted exactly, or null",
  "summary": "one sentence summary of what happened, to carry forward"
}`;

const overallSystem = (persona) => `You are ${persona}, and you have just finished a novel in progress. Write the author a candid, specific letter about the whole, in character. First person.`;

const overallUser = (notes) => `My scene-by-scene notes, in order:
${notes.map((n, i) => `${i + 1}. [${n.engagement}/5, ${n.pace}] ${n.summary} — ${n.reaction}`).join("\n")}

Return JSON:
{
  "verdict": "3-5 sentences on the book as a whole",
  "strongest": ["what worked best, specific", "..."],
  "weakest": ["what held it back, specific", "..."],
  "pacing": "2-3 sentences on where it dragged and where it raced",
  "threads": ["a storyline or question I cared about that was dropped or under-served", "..."],
  "would_recommend": <true|false>
}`;

/**
 * Review the given scenes ({file, name, content}). Skips scenes already in
 * `data` unless force. Calls onProgress({index,total,message}).
 */
export const runReader = async (dir, scenes, { readerId = "first-time", force = false, onProgress = () => {}, signal } = {}) => {
  const all = loadReader(dir);
  const reader = readerById(readerId, all);
  if (!reader) throw new Error("Unknown reader.");
  if (!all.readers[readerId]) all.readers[readerId] = { scenes: {}, overall: null };
  const data = all.readers[readerId];
  const prior = [];
  for (let i = 0; i < scenes.length; i += 1) {
    if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
    const s = scenes[i];
    const text = plain(s.content);
    const existing = data.scenes[s.file];
    if (existing && !force) {
      prior.push(existing.summary);
      continue;
    }
    if (!text.trim()) continue;
    onProgress({ index: i, total: scenes.length, message: `${reader.name} is reading “${s.name}” (${i + 1} of ${scenes.length})` });
    const out = await complete({
      system: sceneSystem(personaText(reader)),
      user: sceneUser({ name: s.name, text: text.slice(0, 24000) }, i, scenes.length, prior.slice(-12)),
      json: true,
      signal,
    });
    const note = {
      engagement: Math.max(1, Math.min(5, Number(out.engagement) || 3)),
      clarity: Math.max(1, Math.min(5, Number(out.clarity) || 3)),
      pace: ["slow", "steady", "brisk", "rushed"].includes(out.pace) ? out.pace : "steady",
      reaction: String(out.reaction || "").trim(),
      questions: Array.isArray(out.questions) ? out.questions.map(String).filter(Boolean).slice(0, 4) : [],
      memorable: out.memorable ? String(out.memorable).trim() : null,
      summary: String(out.summary || "").trim(),
      at: Date.now(),
      words: text.split(/\s+/).length,
    };
    data.scenes[s.file] = note;
    prior.push(note.summary);
    saveReader(dir, all);
  }
  const notes = scenes.map((s) => data.scenes[s.file]).filter(Boolean);
  if (notes.length >= 2) {
    onProgress({ index: scenes.length, total: scenes.length, message: `${reader.name} is writing the letter about the whole` });
    const out = await complete({ system: overallSystem(personaText(reader)), user: overallUser(notes), json: true, maxTokens: 2048, signal });
    data.overall = {
      verdict: String(out.verdict || "").trim(),
      strongest: Array.isArray(out.strongest) ? out.strongest.map(String) : [],
      weakest: Array.isArray(out.weakest) ? out.weakest.map(String) : [],
      pacing: String(out.pacing || "").trim(),
      threads: Array.isArray(out.threads) ? out.threads.map(String) : [],
      wouldRecommend: !!out.would_recommend,
      at: Date.now(),
      scenes: notes.length,
    };
    saveReader(dir, all);
  }
  return all;
};

export const clearReader = (dir, readerId) => {
  const all = loadReader(dir);
  if (readerId) all.readers[readerId] = { scenes: {}, overall: null };
  else all.readers = {};
  saveReader(dir, all);
};
