/* Spinner as editor: revise a scene (or a selected passage of it) along a
   given direction, changing as little as possible. The caller weaves the
   result back in with ../revise, so only genuinely new words become Spinner's. */
import { complete } from "./client";
import { sceneContext } from "./ideas";

const SYSTEM = `You are Spinner, a novelist's editor working inside their story bible. You revise prose exactly as directed and change as little as you can: every sentence the direction doesn't touch stays word-for-word identical — same spelling, punctuation and paragraph breaks — so the writer's own words remain theirs. Match the manuscript's voice, tense and register. Never summarise, never add headings, notes, labels or quotation marks around the text, never contradict the known facts. Return only the revised prose, as JSON.`;

const trunc = (s, n, fromEnd) => (!s ? "" : s.length <= n ? s : fromEnd ? "…" + s.slice(-n) : s.slice(0, n) + "…");

/**
 * @param {object} p
 * @param {object} p.snippet         the scene actor
 * @param {object[]} p.actors        all actors in the project
 * @param {string} p.direction       what to do ("tighten the dialogue", an idea to integrate…)
 * @param {{whole, passage, before, after}} p.text  from revise.sceneText
 * @returns {Promise<string>} revised scene text, or revised passage when one was given
 */
export const reviseScene = async ({ snippet, actors, direction, text, signal }) => {
  const { cast, facts, threads } = sceneContext(snippet, actors);
  const target = text.passage != null ? text.passage : text.whole;
  const words = (target.match(/\S+/g) || []).length;
  const user = `Scene${snippet.name ? `: ${snippet.name}` : ""}${threads.length ? ` (in ${threads.join(", ")})` : ""}

People and things present: ${cast.join("; ") || "(none recorded)"}

Known facts that bear on this scene:
${facts.map((f) => `- ${f}`).join("\n") || "(none)"}

${text.passage != null ? `The writer has selected one passage to revise. Context before it (do not return this):
"""
${trunc(text.before, 2500, true)}
"""

Passage to revise:
"""
${text.passage}
"""

Context after it (do not return this):
"""
${trunc(text.after, 2500, false)}
"""` : `The scene:
"""
${text.whole}
"""`}

Direction: ${direction}

Apply the direction to ${text.passage != null ? "the passage only" : "the scene"}, keeping everything the direction doesn't require unchanged. Return JSON: { "revised": "${text.passage != null ? "the whole revised passage" : "the whole revised scene"}, paragraphs separated by blank lines" }`;
  const out = await complete({ system: SYSTEM, user, json: true, maxTokens: Math.min(8000, Math.max(800, Math.round(words * 2.2) + 600)), signal });
  const revised = out && typeof out.revised === "string" ? out.revised : typeof out === "string" ? out : "";
  if (!revised.trim()) throw new Error("Spinner returned no revision.");
  return revised.trim();
};
