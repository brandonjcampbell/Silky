/* Model-written encyclopedia entries for elements, saved in the project as
   wiki.json (not an actor). Each entry is built only from the project's own
   facts, so the wiki never knows more than the book does. */
import { complete } from "../llm/client";
import { existsSync, readFileSync, writeFileSync } from "../storage";
import { plain } from "../analysis/text";

const FILE = "wiki.json";

export const loadArticles = (dir) => {
  try {
    if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE));
  } catch (e) {
    /* missing or corrupt */
  }
  return { articles: {} };
};
export const saveArticles = (dir, data) => writeFileSync(dir + FILE, JSON.stringify(data));
export const clearArticles = (dir) => saveArticles(dir, { articles: {} });

const SYSTEM = `You write entries for a story bible's wiki, in the voice of an encyclopedia about the fictional world: neutral, past or present tense as the facts imply, no evaluation of the writing. Use only the facts given — invent nothing, and do not draw on any knowledge of similar books. Where the facts conflict, note the conflict. Group related facts into paragraphs rather than listing them. Mention other named elements by their exact names.`;

const user = (el, facts, scenes) => `Entry subject: ${el.name}${el.description ? ` — ${el.description}` : ""}

Facts established about ${el.name}, in story order (scene numbers in brackets):
${facts.map((f) => `- [${f.scene}] ${f.statement}`).join("\n")}

Scenes where ${el.name} appears, in order: ${scenes.join("; ") || "(none recorded)"}

Return JSON: { "paragraphs": ["...", "..."], "oneLine": "a single sentence summarising who or what this is" }
Write 1 to 4 paragraphs depending on how much is known. Plain text, no markdown.`;

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Write entries for the given elements (actors). Skips ones already written
 * unless force. onProgress({index,total,message}).
 */
export const writeArticles = async (dir, elements, index, { force = false, minFacts = 3, onProgress = () => {}, signal } = {}) => {
  const data = loadArticles(dir);
  const todo = elements.filter((e) => (force || !data.articles[e.file]) && (e.involved_in || []).length >= minFacts);
  for (let i = 0; i < todo.length; i += 1) {
    if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
    const el = todo[i];
    onProgress({ index: i, total: todo.length, message: `Writing “${el.name}” (${i + 1} of ${todo.length})` });
    const facts = (el.involved_in || [])
      .map((f) => index.byFile.get(f))
      .filter(Boolean)
      .map((f) => ({ statement: f.name, scene: Math.min(...(f.revealed_by || []).map(index.sceneOrder), 1e9) }))
      .sort((a, b) => a.scene - b.scene)
      .map((f) => ({ ...f, scene: f.scene < 1e9 ? f.scene + 1 : "·" }));
    const scenes = [...(index.appearances.get(el.file) || [])]
      .sort((a, b) => index.sceneOrder(a) - index.sceneOrder(b))
      .map((s) => (index.byFile.get(s) || {}).name)
      .filter(Boolean);
    const out = await complete({
      system: SYSTEM,
      user: user({ name: el.name, description: plain(el.content).trim() }, facts.slice(0, 120), scenes),
      json: true,
      maxTokens: 1500,
      signal,
    });
    const paras = Array.isArray(out.paragraphs) ? out.paragraphs.map((p) => String(p).trim()).filter(Boolean) : [];
    data.articles[el.file] = {
      html: paras.map((p) => `<p>${esc(p)}</p>`).join(""),
      oneLine: String(out.oneLine || "").trim(),
      facts: facts.length,
      at: Date.now(),
    };
    saveArticles(dir, data);
  }
  return data;
};
