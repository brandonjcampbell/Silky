/* Spinner refines a scene scan: which candidate facts this scene really
   establishes, and what it establishes that the project doesn't know yet. */
import { complete } from "./client";

const SYSTEM = `You are checking one scene of a novel against the author's story bible. Be strict: a fact is "established here" only if this scene's text states or clearly shows it, not merely if the people involved appear. New facts must be world-truths a writer would track (relationships, histories, rules, places, objects), phrased as complete declarative sentences, and must not duplicate the candidates. Use the exact names from the cast list.`;

const user = (scene, cast, candidates) => `Known cast (use these exact names):
${cast.map((c) => `- ${c}`).join("\n") || "(none)"}

Candidate facts from the bible that might be established in this scene:
${candidates.map((c, i) => `${i + 1}. ${c}`).join("\n") || "(none)"}

Scene${scene.name ? `: ${scene.name}` : ""}
"""
${scene.text}
"""

Return JSON:
{
  "established": [<candidate numbers that this scene states or clearly shows>],
  "new_facts": [{ "statement": "string", "involves": ["exact cast name", "..."] }],
  "new_elements": [{ "name": "string", "kind": "person|place|thing|group|idea", "icon": "emoji", "description": "one sentence" }]
}
At most 8 new facts and 5 new elements; fewer is fine.`;

/**
 * @returns {{ established: number[], newFacts: {statement, involves}[], newElements: {...}[] }}
 */
export const scanWithModel = async ({ scene, cast, candidates, signal }) => {
  const out = await complete({ system: SYSTEM, user: user(scene, cast, candidates.slice(0, 60)), json: true, maxTokens: 3000, signal });
  const established = (Array.isArray(out.established) ? out.established : [])
    .map((n) => Number(n) - 1)
    .filter((i) => i >= 0 && i < candidates.length);
  const newFacts = (Array.isArray(out.new_facts) ? out.new_facts : [])
    .filter((f) => f && f.statement)
    .map((f) => ({ statement: String(f.statement).trim(), involves: Array.isArray(f.involves) ? f.involves.map(String) : [] }));
  const newElements = (Array.isArray(out.new_elements) ? out.new_elements : [])
    .filter((e) => e && e.name)
    .map((e) => ({ name: String(e.name).trim(), kind: e.kind || "thing", icon: typeof e.icon === "string" ? e.icon.trim() : "", description: e.description ? String(e.description).trim() : "" }));
  return { established, newFacts, newElements };
};
