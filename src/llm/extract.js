import { complete } from "./client";
import { existsSync, mkdirSync, writeFileSync, projectDir } from "../storage";
export { uniqueProjectName } from "../storage/projectIO";

/* ────────────────────────────────────────────────────────────────────────
   1. Split a manuscript into scenes. Deterministic; no model involved.
   ──────────────────────────────────────────────────────────────────────── */

const BREAK_RE = /^\s*(?:#{1,4}\s+.+|(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,}|(?:chapter|part|book|scene|prologue|epilogue|interlude)\b[^\n]{0,60})\s*$/i;
const HEADING_RE = /^\s*(?:#{1,4}\s+(.+)|((?:chapter|part|book|scene|prologue|epilogue|interlude)\b[^\n]{0,60}))\s*$/i;
const TARGET_WORDS = 1500;

const wc = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** @returns {{title: string|null, text: string, words: number}[]} */
export const splitManuscript = (raw) => {
  const text = String(raw || "").replace(/\r\n?/g, "\n").replace(/ /g, " ");
  const lines = text.split("\n");
  const scenes = [];
  let cur = { title: null, paras: [] };
  let para = [];

  const flushPara = () => {
    if (para.length) {
      cur.paras.push(para.join(" ").trim());
      para = [];
    }
  };
  const flushScene = () => {
    flushPara();
    if (cur.paras.length) scenes.push(cur);
    cur = { title: null, paras: [] };
  };

  for (const line of lines) {
    if (BREAK_RE.test(line)) {
      flushScene();
      const m = line.match(HEADING_RE);
      if (m) cur.title = (m[1] || m[2] || "").replace(/^#+\s*/, "").trim();
      continue;
    }
    if (!line.trim()) {
      flushPara();
      continue;
    }
    para.push(line.trim());
  }
  flushScene();

  // Long unbroken stretches get chunked at paragraph boundaries.
  const out = [];
  scenes.forEach((s) => {
    const total = s.paras.reduce((n, p) => n + wc(p), 0);
    if (total <= TARGET_WORDS * 1.6) {
      out.push({ title: s.title, paras: s.paras });
      return;
    }
    let chunk = [];
    let n = 0;
    let part = 1;
    s.paras.forEach((p) => {
      chunk.push(p);
      n += wc(p);
      if (n >= TARGET_WORDS) {
        out.push({ title: s.title ? `${s.title} (${part})` : null, paras: chunk });
        chunk = [];
        n = 0;
        part += 1;
      }
    });
    if (chunk.length) out.push({ title: s.title ? `${s.title} (${part})` : null, paras: chunk });
  });

  return out.map((s) => ({
    title: s.title,
    text: s.paras.join("\n\n"),
    words: s.paras.reduce((n, p) => n + wc(p), 0),
  }));
};

/* ────────────────────────────────────────────────────────────────────────
   2. Ask the model about each scene.
   ──────────────────────────────────────────────────────────────────────── */

const SCENE_SYSTEM = `You are helping a novelist build a story bible from their manuscript. Read one scene and extract its model.

Definitions:
- element: a noun in the story world that recurs or matters — a character, place, object, organisation, substance, idea. Not every noun; the ones a writer would track.
- fact: a single true statement about the story world established or strongly implied in this scene, phrased as a complete declarative sentence a writer could reuse ("Delia is Chrysanthemum's great-granddaughter"). Not plot summary; world-truths.

Rules:
- Reuse the exact names from the known-elements list when they refer to the same thing; do not invent variants.
- Each fact names which elements it involves, by exact name.
- 3 to 12 elements and 2 to 10 facts per scene. Fewer is fine if the scene is thin.
- "title": a short title for the scene (2–6 words) if none is given.
- "icon": one emoji that suits each element (a face for people, an object for things).
- "kind": one of person, place, thing, group, idea.`;

const sceneUser = (scene, index, known) => {
  const knownList = known.length
    ? known.map((k) => `- ${k.name} (${k.kind})`).join("\n")
    : "(none yet)";
  return `Known elements so far:
${knownList}

Scene ${index + 1}${scene.title ? `: ${scene.title}` : ""}
"""
${scene.text}
"""

Return JSON:
{
  "title": "string",
  "elements": [{ "name": "string", "kind": "person|place|thing|group|idea", "icon": "emoji", "description": "one sentence" }],
  "facts": [{ "statement": "string", "involves": ["element name", "..."] }]
}`;
};

const CAUSES_SYSTEM = `You are helping a novelist map cause and effect in their story bible. Given numbered facts, list the pairs where one fact is a direct cause of another. Only include links the text clearly supports. Be conservative.`;

const causesUser = (facts) =>
  `Facts:
${facts.map((f, i) => `${i + 1}. ${f.statement}`).join("\n")}

Return JSON: { "links": [{ "cause": <number>, "effect": <number> }] }`;

const THREADS_SYSTEM = `You are helping a novelist find the separate plot threads in their manuscript. A thread is a storyline a reader could follow on its own: one character's arc, a subplot, a mystery from its first clue to its solution, a journey. Threads may share scenes, and a scene may belong to several threads or to none.

Rules:
- 2 to 8 threads. Each needs at least 3 scenes. Do not make a thread that is simply "the whole book".
- List each thread's scenes by number, in manuscript order, including every scene where that storyline advances.
- "name": 2–5 words, the way a writer would label it ("Lucy's decline", "The voyage of the Demeter").
- "description": one or two sentences on what the thread is about and where it begins and ends.
- "icon": one emoji.`;

const threadsUser = (scenes, sceneResults, facts) => {
  const factByKey = new Map(facts.map((f) => [f.key, f]));
  const lines = scenes.map((s, i) => {
    const r = sceneResults[i] || { facts: [] };
    const title = r.title || s.title || `Scene ${i + 1}`;
    const opening = s.text.replace(/\s+/g, " ").split(" ").slice(0, 40).join(" ");
    const fs = r.facts.slice(0, 4).map((k) => factByKey.get(k)).filter(Boolean).map((f) => "    - " + f.statement);
    return `${i + 1}. ${title}\n    "${opening}…"` + (fs.length ? "\n" + fs.join("\n") : "");
  });
  return `Scenes:\n${lines.join("\n")}\n\nReturn JSON: { "threads": [{ "name": "string", "icon": "emoji", "description": "string", "scenes": [<number>, ...] }] }`;
};

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

/** First grapheme of a string (keeps ZWJ/skin-tone emoji whole), or "". */
const firstGlyph = (s) => {
  const t = typeof s === "string" ? s.trim() : "";
  if (!t) return "";
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(t)[Symbol.iterator]().next();
    return it.done ? "" : it.value.segment;
  }
  return Array.from(t).slice(0, 8).join("");
};

/**
 * Run extraction over scenes. Calls onProgress({step, index, total, message}).
 * Returns { scenes, elements, facts, links }.
 */
export const extractModel = async (scenes, { onProgress = () => {}, signal } = {}) => {
  const elements = []; // {name, kind, icon, description, key}
  const facts = []; // {statement, involves:[element keys], sceneIndex, key}
  const byKey = new Map();

  const upsertElement = (e) => {
    const key = norm(e.name);
    if (!key) return null;
    if (byKey.has(key)) {
      const ex = byKey.get(key);
      if (!ex.description && e.description) ex.description = e.description;
      if (!ex.icon && e.icon) ex.icon = e.icon;
      return ex;
    }
    const el = {
      key,
      name: String(e.name).trim(),
      kind: e.kind || "thing",
      icon: firstGlyph(e.icon),
      description: e.description ? String(e.description).trim() : "",
    };
    byKey.set(key, el);
    elements.push(el);
    return el;
  };

  const sceneResults = [];
  for (let i = 0; i < scenes.length; i += 1) {
    if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress({ step: "scenes", index: i, total: scenes.length, message: `Reading scene ${i + 1} of ${scenes.length}` });
    let out;
    try {
      out = await complete({ system: SCENE_SYSTEM, user: sceneUser(scenes[i], i, elements), json: true, signal });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      // One bad scene shouldn't sink the import; record and continue.
      sceneResults.push({ title: scenes[i].title, elements: [], facts: [], error: e.message });
      continue;
    }
    const els = Array.isArray(out.elements) ? out.elements.map(upsertElement).filter(Boolean) : [];
    const fs = Array.isArray(out.facts) ? out.facts : [];
    const sceneFacts = [];
    fs.forEach((f) => {
      if (!f || !f.statement) return;
      const key = norm(f.statement);
      let fact = facts.find((x) => x.key === key);
      if (!fact) {
        fact = { key, statement: String(f.statement).trim(), involves: new Set(), scenes: new Set() };
        facts.push(fact);
      }
      (Array.isArray(f.involves) ? f.involves : []).forEach((n) => {
        const el = upsertElement({ name: n });
        if (el) fact.involves.add(el.key);
      });
      fact.scenes.add(i);
      sceneFacts.push(fact);
    });
    sceneResults.push({
      title: scenes[i].title || (typeof out.title === "string" ? out.title.trim() : null),
      elements: els.map((e) => e.key),
      facts: sceneFacts.map((f) => f.key),
    });
  }

  let links = [];
  if (facts.length >= 2 && facts.length <= 80) {
    onProgress({ step: "causes", index: 0, total: 1, message: "Looking for cause and effect" });
    try {
      const out = await complete({ system: CAUSES_SYSTEM, user: causesUser(facts), json: true, signal });
      links = (Array.isArray(out.links) ? out.links : [])
        .map((l) => ({ cause: Number(l.cause) - 1, effect: Number(l.effect) - 1 }))
        .filter((l) => l.cause >= 0 && l.effect >= 0 && l.cause < facts.length && l.effect < facts.length && l.cause !== l.effect);
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      links = [];
    }
  }

  let threads = [];
  if (scenes.length >= 6) {
    onProgress({ step: "threads", index: 0, total: 1, message: "Tracing plot threads" });
    try {
      const out = await complete({ system: THREADS_SYSTEM, user: threadsUser(scenes, sceneResults, facts), json: true, maxTokens: 8192, signal });
      threads = (Array.isArray(out.threads) ? out.threads : [])
        .map((t) => ({
          name: String(t.name || "").trim(),
          icon: firstGlyph(t.icon) || "🧵",
          description: String(t.description || "").trim(),
          scenes: [...new Set((Array.isArray(t.scenes) ? t.scenes : []).map((n) => Number(n) - 1).filter((n) => n >= 0 && n < scenes.length))].sort((a, b) => a - b),
        }))
        .filter((t) => t.name && t.scenes.length >= 3 && t.scenes.length < scenes.length);
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      threads = [];
    }
  }

  return { scenes: sceneResults, elements, facts, links, threads };
};

/* ────────────────────────────────────────────────────────────────────────
   3. Write the project.
   ──────────────────────────────────────────────────────────────────────── */

const toHtml = (text) =>
  text
    .split(/\n{2,}/)
    .map((p) => "<p>" + p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>") + "</p>")
    .join("");

const KIND_ICON = { person: "🙂", place: "📍", thing: "🔹", group: "🏛️", idea: "💡" };

/**
 * Build the actors and write them. `model` may be null for a scenes-only
 * import. Returns the project name.
 */
export const writeProject = (name, scenes, model) => {
  const dir = projectDir(name);
  if (!existsSync(dir)) {
    mkdirSync(dir);
    mkdirSync(`${dir}rubbish`);
  }
  const stamp = Date.now().toString(36);
  let seq = 0;
  const id = (t) => `${t}-${stamp}-${(seq++).toString(36)}`;
  const actors = [];
  const mk = (type, name, icon, extra) => {
    const uuid = id(type);
    const a = { name, file: `${uuid}.element.json`, type, icon, order: actors.length, uuid, captured_in: [], ...extra };
    actors.push(a);
    return a;
  };

  // snippets
  const snippets = scenes.map((s, i) => {
    const title = (model && model.scenes[i] && model.scenes[i].title) || s.title || `Scene ${i + 1}`;
    return mk("snippet", title, "📜", { content: toHtml(s.text), reveals: [], sequenced_in: [] });
  });

  // thread
  const thread = mk("thread", "Manuscript", "🧵", { content: "", sequences: snippets.map((s) => s.file) });
  snippets.forEach((s) => s.sequenced_in.push(thread.file));

  // plot threads the model traced: each sequences a subset of the scenes
  ((model && model.threads) || []).forEach((t) => {
    const th = mk("thread", t.name, t.icon || "🧵", { content: t.description ? toHtml(t.description) : "", sequences: [] });
    t.scenes.forEach((si) => {
      const sn = snippets[si];
      if (sn) {
        th.sequences.push(sn.file);
        sn.sequenced_in.push(th.file);
      }
    });
  });

  const elementByKey = new Map();
  const factByKey = new Map();

  if (model) {
    model.elements.forEach((e) => {
      const el = mk("element", e.name, e.icon || KIND_ICON[e.kind] || "🔹", {
        content: e.description ? toHtml(e.description) : " ",
        involved_in: [],
      });
      elementByKey.set(e.key, el);
    });
    model.facts.forEach((f) => {
      const fact = mk("fact", f.statement, "💡", { content: [], causes: [], because: [], involves: [], revealed_by: [] });
      f.involves.forEach((k) => {
        const el = elementByKey.get(k);
        if (el) {
          fact.involves.push(el.file);
          el.involved_in.push(fact.file);
        }
      });
      f.scenes.forEach((si) => {
        const sn = snippets[si];
        if (sn) {
          sn.reveals.push(fact.file);
          fact.revealed_by.push(sn.file);
        }
      });
      factByKey.set(f.key, fact);
    });
    model.links.forEach((l) => {
      const cause = factByKey.get(model.facts[l.cause].key);
      const effect = factByKey.get(model.facts[l.effect].key);
      if (cause && effect && !effect.because.includes(cause.file)) {
        effect.because.push(cause.file);
        cause.causes.push(effect.file);
      }
    });
  }

  // web: everything, laid out in rings
  const web = mk("web", `${name} — whole web`, "🕸️", { captures: [], expands: ["reveals", "because", "involves", "then"] });
  const groups = [
    ["element", 500, 320],
    ["fact", 330, 210],
    ["snippet", 170, 100],
    ["thread", 60, 30],
  ];
  groups.forEach(([type, rx, ry]) => {
    const items = actors.filter((a) => a.type === type);
    items.forEach((a, i) => {
      const ang = (2 * Math.PI * i) / Math.max(items.length, 1);
      web.captures.push({ file: a.file, x: Math.round(600 + rx * Math.cos(ang)), y: Math.round(420 + ry * Math.sin(ang)) });
      a.captured_in.push(web.file);
    });
  });

  actors.forEach((a) => writeFileSync(dir + a.file, JSON.stringify(a)));
  return name;
};
