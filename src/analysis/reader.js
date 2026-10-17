/* "Reader" analysis: a model reads each scene as a first-time reader and
   says how it landed. Results are saved in the project as a plain JSON file
   (not an actor, so it never shows in the lists). */
import { complete } from "../llm/client";
import { existsSync, readFileSync, writeFileSync } from "../storage";
import { plain } from "./text";

const FILE = "analysis.reader.json";

export const loadReader = (dir) => {
  try {
    if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE));
  } catch (e) {
    /* corrupt or missing */
  }
  return { scenes: {}, overall: null };
};

export const saveReader = (dir, data) => writeFileSync(dir + FILE, JSON.stringify(data));

const SCENE_SYSTEM = `You are an attentive first-time reader of a novel in progress, giving the author candid notes. You have read the earlier scenes (summarised) and are now reading the next one. Be specific and honest; praise only what earns it. Write in the first person as a reader ("I lost the thread when…"), not as an editor issuing rules.`;

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

const OVERALL_SYSTEM = `You are an attentive first-time reader who has just finished a novel in progress, writing the author a candid, specific letter about the whole. First person, as a reader.`;

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
export const runReader = async (dir, scenes, { force = false, onProgress = () => {}, signal } = {}) => {
  const data = loadReader(dir);
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
    onProgress({ index: i, total: scenes.length, message: `Reading “${s.name}” (${i + 1} of ${scenes.length})` });
    const out = await complete({
      system: SCENE_SYSTEM,
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
    saveReader(dir, data);
  }
  const notes = scenes.map((s) => data.scenes[s.file]).filter(Boolean);
  if (notes.length >= 2) {
    onProgress({ index: scenes.length, total: scenes.length, message: "Writing the letter about the whole" });
    const out = await complete({ system: OVERALL_SYSTEM, user: overallUser(notes), json: true, maxTokens: 2048, signal });
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
    saveReader(dir, data);
  }
  return data;
};

export const clearReader = (dir) => saveReader(dir, { scenes: {}, overall: null });
