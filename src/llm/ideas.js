/* Ask Spinner for ideas about a scene. Suggestions are text the writer may
   insert; anything inserted is tracked as AI-written (see ../provenance). */
import { complete } from "./client";
import { plain } from "../analysis/text";

export const IDEA_KINDS = [
  { id: "next", name: "What happens next?", prompt: "Suggest what could happen next in this scene or immediately after it: three different directions, each a short paragraph of prose the writer could continue from.", insertable: true },
  { id: "continue", name: "Continue the scene", prompt: "Continue the scene from exactly where it stops, in its voice and tense: three alternative continuations of 80–150 words each.", insertable: true },
  { id: "dialogue", name: "A line of dialogue", prompt: "Suggest three lines (or short exchanges) of dialogue that could be spoken at the point where the scene ends or at its most charged moment, in each character's established voice.", insertable: true },
  { id: "describe", name: "Describe the setting", prompt: "Write three short passages (40–80 words) of description for the scene's setting, in the manuscript's register, each from a different sensory angle.", insertable: true },
  { id: "complication", name: "A complication", prompt: "Propose three complications that could enter this scene and make it harder for the people in it, consistent with the known facts. One short paragraph each, as prose that could be inserted.", insertable: true },
  { id: "deepen", name: "Deepen a character", prompt: "For the main character in this scene, suggest three small moments — a gesture, a thought, a thing they notice — that would reveal who they are without stating it. Each as a sentence or two of prose.", insertable: true },
  { id: "questions", name: "Questions a reader would ask", prompt: "List three questions a careful reader would be asking at the end of this scene, and for each, one way the writer might answer or sharpen it. These are notes, not prose.", insertable: false },
  { id: "custom", name: "Ask anything", prompt: "", insertable: true },
  { id: "revise", name: "Revise", prompt: "", revise: true },
];

const SYSTEM = `You are Spinner, a writing collaborator inside a novelist's story bible. You know only what is in the project: the scene text and the facts given. Match the manuscript's voice, tense and register exactly; never summarise or explain the scene back; never add headings or labels; never contradict the known facts. Offer genuinely different options, not variations on one. Keep each suggestion self-contained.`;

const user = ({ scene, facts, cast, threads, kind, question }) => `Scene${scene.name ? `: ${scene.name}` : ""}${threads.length ? ` (in ${threads.join(", ")})` : ""}
"""
${scene.text}
"""

People and things present: ${cast.join("; ") || "(none recorded)"}

Known facts that bear on this scene:
${facts.map((f) => `- ${f}`).join("\n") || "(none)"}

Task: ${kind.prompt || ""}${question ? `\nThe writer asks: ${question}` : ""}

Return JSON: { "suggestions": [{ "title": "3–6 words naming the idea", "text": "the suggestion itself", "why": "one sentence on what it does for the scene" }] }
Exactly three suggestions.`;

/**
 * @returns {Promise<{title, text, why}[]>}
 */
/** Cast, bearing facts and thread names for a scene — shared by the prompts. */
export const sceneContext = (snippet, actors) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const text = plain(snippet.content);
  const reveals = (snippet.reveals || []).map((f) => byFile.get(f)).filter(Boolean);
  const castSet = new Map();
  reveals.forEach((f) => (f.involves || []).forEach((e) => castSet.set(e, (castSet.get(e) || 0) + 1)));
  // also elements named in the text
  const lower = text.toLowerCase();
  actors.filter((a) => a.type === "element" && a.name.length > 2 && lower.includes(a.name.toLowerCase())).forEach((e) => castSet.set(e.file, (castSet.get(e.file) || 0) + 1));
  const cast = [...castSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([f]) => byFile.get(f)).filter(Boolean);
  // facts: this scene's own, plus the most recent facts about the cast from earlier scenes
  const factSet = new Set(reveals.map((f) => f.file));
  cast.forEach((e) => (e.involved_in || []).slice(-6).forEach((f) => factSet.add(f)));
  const facts = [...factSet].map((f) => byFile.get(f)).filter(Boolean).slice(0, 60).map((f) => f.name);
  const threads = (snippet.sequenced_in || []).map((t) => byFile.get(t)).filter((t) => t && t.name !== "Manuscript").map((t) => t.name);
  return { text, cast: cast.map((e) => e.name), facts, threads };
};

/**
 * @returns {Promise<{title, text, why}[]>}
 */
export const askIdeas = async ({ snippet, actors, kindId, question, signal }) => {
  const kind = IDEA_KINDS.find((k) => k.id === kindId) || IDEA_KINDS[0];
  const { text, cast, facts, threads } = sceneContext(snippet, actors);
  const out = await complete({
    system: SYSTEM,
    user: user({ scene: { name: snippet.name, text: text.slice(-16000) }, facts, cast, threads, kind, question }),
    json: true,
    maxTokens: 2500,
    signal,
  });
  return (Array.isArray(out.suggestions) ? out.suggestions : [])
    .filter((s) => s && s.text)
    .slice(0, 3)
    .map((s) => ({ title: String(s.title || "").trim(), text: String(s.text).trim(), why: String(s.why || "").trim() }));
};
