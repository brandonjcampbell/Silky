/* Talking to Spinner about the narrative. Conversations are saved in the
   project (talk.json); Spinner is briefed with a digest of the project plus
   whatever the writer has brought into the conversation. */
import { chat, complete } from "./client";
import { existsSync, readFileSync, writeFileSync } from "../storage";
import { plain, wordCount } from "../analysis/text";

const FILE = "talk.json";

export const loadTalk = (dir) => {
  try {
    if (existsSync(dir + FILE)) return JSON.parse(readFileSync(dir + FILE));
  } catch (e) {
    /* missing or corrupt */
  }
  return { version: 1, conversations: [] };
};
export const saveTalk = (dir, data) => writeFileSync(dir + FILE, JSON.stringify(data));

export const newConversation = (dir, title = "New conversation", extra = {}) => {
  const data = loadTalk(dir);
  const c = { id: "talk-" + Date.now().toString(36), title, at: Date.now(), messages: [], focus: [], kind: "spinner", participants: [], asOf: null, ...extra };
  data.conversations.unshift(c);
  saveTalk(dir, data);
  return c;
};
export const updateConversation = (dir, conv) => {
  const data = loadTalk(dir);
  data.conversations = data.conversations.map((c) => (c.id === conv.id ? { ...conv, at: Date.now() } : c));
  saveTalk(dir, data);
};
export const deleteConversation = (dir, id) => {
  const data = loadTalk(dir);
  data.conversations = data.conversations.filter((c) => c.id !== id);
  saveTalk(dir, data);
};

export const OPENERS = [
  { label: "I'm stuck", text: "I'm stuck. Here's where I am and what I've tried — help me find the way through." },
  { label: "What does she want?", text: "Take the main character in the scene I've brought in. What does she want in this scene, what's in the way, and what would she never do to get it?" },
  { label: "Three endings", text: "Give me three different ways the scene I've brought in could end, each in a sentence, and tell me what each one costs." },
  { label: "Interrogate my villain", text: "Interview my antagonist. Ask them five questions a good detective would, and answer in their voice from what the project knows." },
  { label: "What's the reader feeling?", text: "At this point in the manuscript, what is a first-time reader feeling, expecting, and dreading? Where am I spending their patience?" },
  { label: "Argue with me", text: "I think the next scene should be [fill this in]. Argue against it, honestly, using the facts in the project." },
  { label: "Smallest next step", text: "I don't need the whole scene. What is the smallest next thing that could happen — one gesture, one line, one decision — that would let me write the next paragraph?" },
];

const SYSTEM = `You are Spinner, the writing partner inside Silky, a novelist's story bible. You are talking with the author about their book, which you know only through the project digest and anything they bring into the conversation below. Your job is to get them writing again.

How you work:
- Ask more than you tell. One good question beats three suggestions. When you do suggest, offer two or three sharply different options, each in a sentence or two, and say what each would cost the story.
- Use the project's own names and facts, and point to them ("you established in Chapter 7 that…"). Never contradict a known fact; if the author seems to, ask about it.
- Do not write the scene unless asked outright. If asked, keep it short and in the manuscript's voice.
- Be candid. If an idea is weaker than another, say so and why.
- Keep replies short — a paragraph or two, no headings, no bullet lists unless the author asks for a list. This is a conversation, not a report.`;

/** A compact picture of the project for the system prompt. */
export const projectDigest = (project, actors) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const threads = actors.filter((a) => a.type === "thread");
  const manu = threads.find((t) => t.name === "Manuscript") || [...threads].sort((a, b) => b.sequences.length - a.sequences.length)[0];
  const scenes = (manu ? manu.sequences.map((f) => byFile.get(f)) : actors.filter((a) => a.type === "snippet")).filter(Boolean);
  const elements = [...actors.filter((a) => a.type === "element")].sort((a, b) => (b.involved_in || []).length - (a.involved_in || []).length);
  const words = scenes.reduce((n, s) => n + wordCount(plain(s.content)), 0);
  const lines = [];
  lines.push(`Project: ${project}. ${scenes.length} scenes, ${words.toLocaleString()} words, ${elements.length} elements, ${actors.filter((a) => a.type === "fact").length} facts.`);
  if (scenes.length) lines.push("Scenes in order: " + scenes.map((s, i) => `${i + 1}. ${s.name}`).join("; "));
  const other = threads.filter((t) => t !== manu);
  if (other.length) lines.push("Plot threads: " + other.map((t) => `${t.name} (${t.sequences.length} scenes${plain(t.content).trim() ? ": " + plain(t.content).trim().slice(0, 140) : ""})`).join(" | "));
  if (elements.length) lines.push("Principal elements: " + elements.slice(0, 25).map((e) => `${e.name}${plain(e.content).trim() ? " — " + plain(e.content).trim().slice(0, 100) : ""}`).join(" | "));
  return lines.join("\n");
};

/** Full text for a thing the writer brought into the conversation. */
export const focusText = (actor, actors) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  if (!actor) return "";
  if (actor.type === "snippet") {
    const facts = (actor.reveals || []).map((f) => byFile.get(f)).filter(Boolean).map((f) => "- " + f.name);
    const text = plain(actor.content);
    return `SCENE "${actor.name}" (${wordCount(text).toLocaleString()} words):\n"""\n${text.slice(0, 12000)}${text.length > 12000 ? "\n[…]" : ""}\n"""${facts.length ? "\nFacts this scene establishes:\n" + facts.join("\n") : ""}`;
  }
  if (actor.type === "element") {
    const facts = (actor.involved_in || []).map((f) => byFile.get(f)).filter(Boolean).map((f) => "- " + f.name);
    return `ELEMENT "${actor.name}": ${plain(actor.content).trim()}\nWhat is known:\n${facts.slice(0, 80).join("\n")}`;
  }
  if (actor.type === "fact") {
    const inv = (actor.involves || []).map((f) => (byFile.get(f) || {}).name).filter(Boolean);
    const because = (actor.because || []).map((f) => (byFile.get(f) || {}).name).filter(Boolean);
    const causes = (actor.causes || []).map((f) => (byFile.get(f) || {}).name).filter(Boolean);
    return `FACT: ${actor.name}\nInvolves: ${inv.join(", ")}${because.length ? "\nBecause: " + because.join("; ") : ""}${causes.length ? "\nCauses: " + causes.join("; ") : ""}`;
  }
  if (actor.type === "thread") {
    const scenes = (actor.sequences || []).map((f) => byFile.get(f)).filter(Boolean);
    return `THREAD "${actor.name}": ${plain(actor.content).trim()}\nScenes: ${scenes.map((s) => s.name).join("; ")}\nOpening of each:\n${scenes.map((s) => `- ${s.name}: ${plain(s.content).replace(/\s+/g, " ").slice(0, 200)}`).join("\n")}`;
  }
  return `${actor.type.toUpperCase()} "${actor.name}"`;
};

/** Ask Spinner the next turn. Returns the reply text. */
export const talk = async ({ project, actors, conversation, signal }) => {
  const focus = (conversation.focus || []).map((f) => actors.find((a) => a.file === f)).filter(Boolean);
  const system = [
    SYSTEM,
    "\n\nPROJECT DIGEST\n" + projectDigest(project, actors),
    focus.length ? "\n\nBROUGHT INTO THE CONVERSATION\n" + focus.map((a) => focusText(a, actors)).join("\n\n") : "",
  ].join("");
  // keep the last 24 turns so the prompt stays bounded
  const messages = conversation.messages.slice(-24).map((m) => ({ role: m.role, content: m.content }));
  return chat({ system, messages, maxTokens: 900, signal });
};

/** A short title for a conversation from its first message. */
export const titleFor = (text) => {
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length > 48 ? t.slice(0, 48).replace(/\s+\S*$/, "") + "…" : t || "New conversation";
};


/* ── talking to the characters themselves ───────────────────────────────── */

const CAST_SYSTEM = `You are voicing characters from a novel in progress, for its author. You play ONLY the characters listed below, each strictly from their own dossier: what they know is what the dossier says, nothing more — not the plot's future, not other characters' secrets, not the fact that they are fictional. Each speaks in a voice that fits their description and the manuscript's period and register. They have motives, moods and blind spots; they can lie, deflect, get angry, refuse to answer, or fall silent. They may address the author (who speaks as "You") or each other.

Write as a script: each line is one character speaking, with optional brief stage direction in parentheses. Keep lines short — one to four sentences. Do not narrate beyond stage directions. Do not break character to explain.`;

const dossier = (el, actors, asOf, order) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const facts = (el.involved_in || [])
    .map((f) => byFile.get(f))
    .filter(Boolean)
    .filter((f) => asOf == null || (f.revealed_by || []).some((s) => order(s) <= asOf) || !(f.revealed_by || []).length)
    .map((f) => "- " + f.name);
  const scenes = [...new Set((el.involved_in || []).flatMap((f) => ((byFile.get(f) || {}).revealed_by || [])))]
    .map((s) => byFile.get(s))
    .filter((s) => s && (asOf == null || order(s.file) <= asOf))
    .sort((a, b) => order(a.file) - order(b.file));
  const first = scenes[0];
  const voice = first ? plain(first.content).replace(/\s+/g, " ").slice(0, 600) : "";
  return `=== ${el.name} ${el.icon || ""}
${plain(el.content).trim() || "(no description)"}
What ${el.name} knows${asOf != null ? ` (as of scene ${asOf + 1})` : ""}:
${facts.length ? facts.slice(0, 80).join("\n") : "- (nothing recorded)"}
Appears in: ${scenes.map((s) => s.name).join("; ") || "(no scenes yet)"}${voice ? `\nA passage from their first scene, for voice and period:\n"${voice}"` : ""}`;
};

/**
 * One exchange with the cast. Returns [{speaker: elementFile, text}].
 * `conversation.participants` are element files; `conversation.asOf` is a
 * manuscript scene index or null; `nudge` asks them to carry on among themselves.
 */
export const castTalk = async ({ project, actors, conversation, nudge = false, signal }) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const threads = actors.filter((a) => a.type === "thread");
  const manu = threads.find((t) => t.name === "Manuscript") || [...threads].sort((a, b) => b.sequences.length - a.sequences.length)[0];
  const orderMap = new Map((manu ? manu.sequences : []).map((f, i) => [f, i]));
  const order = (f) => (orderMap.has(f) ? orderMap.get(f) : 1e9);
  const cast = conversation.participants.map((f) => byFile.get(f)).filter(Boolean);
  if (!cast.length) throw new Error("No one is in the room.");
  const names = cast.map((c) => c.name);
  const system = [
    CAST_SYSTEM,
    `\n\nThe novel: ${project}.`,
    "\n\nCHARACTERS IN THE ROOM\n" + cast.map((c) => dossier(c, actors, conversation.asOf, order)).join("\n\n"),
    `\n\nReturn JSON: { "lines": [{ "speaker": one of ${JSON.stringify(names)}, "text": "what they say, stage directions in parentheses" }] }. ${cast.length === 1 ? "Usually one line; two if the character pauses and goes on." : "One to four lines; let them react to one another, not only to the author."}`,
  ].join("");
  const history = conversation.messages.slice(-30).map((m) =>
    m.role === "user"
      ? { role: "user", content: m.content }
      : { role: "assistant", content: (m.lines || []).map((l) => `${(byFile.get(l.speaker) || {}).name || "?"}: ${l.text}`).join("\n") }
  );
  const user = nudge ? "(The author says nothing. Carry on among yourselves — react to what was just said.)" : history.pop().content;
  const out = await complete({ system, user, history, json: true, maxTokens: 900, signal });
  const lines = (Array.isArray(out.lines) ? out.lines : [])
    .map((l) => {
      const el = cast.find((c) => c.name.toLowerCase() === String(l.speaker || "").toLowerCase()) || cast.find((c) => String(l.speaker || "").toLowerCase().includes(c.name.toLowerCase().split(" ")[0]));
      return el && l.text ? { speaker: el.file, text: String(l.text).trim() } : null;
    })
    .filter(Boolean)
    .slice(0, 4);
  if (!lines.length) throw new Error("The characters had nothing to say. Try again or ask differently.");
  return lines;
};
