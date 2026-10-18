/* Titles for things that emerged from writing: a scene that was never
   named, a book that was called "Writing — Oct 17". */
import { complete } from "./client";
import { plain } from "../analysis/text";

export const isPlaceholderScene = (name) => /^(scene \d+|untitled( scene)?|first scene|new snippet|new scene)$/i.test(String(name || "").trim());
export const isPlaceholderProject = (name) => /^(writing( — .*)?|untitled( \d+)?)$/i.test(String(name || "").trim());

/** @returns {Promise<{scene: string, book: string}>} */
export const suggestTitles = async ({ sceneText, bookSoFar, signal }) => {
  const out = await complete({
    system: "You name things for a novelist, tersely. Scene titles are two to five words, concrete, drawn from what happens or where it happens — never a summary sentence, never a spoiler, no quotation marks. Book titles are one to four words. Return JSON only.",
    user: `Scene text:\n"""\n${plain(sceneText).slice(0, 6000)}\n"""\n${bookSoFar ? `\nOther scenes so far: ${bookSoFar}\n` : ""}\nReturn JSON: { "scene": "title for this scene", "book": "a working title for the book these scenes belong to" }`,
    json: true,
    maxTokens: 120,
    signal,
  });
  const clean = (s) => String(s || "").replace(/^["'“”‘’\s]+|["'“”‘’\s.]+$/g, "").slice(0, 60);
  return { scene: clean(out && out.scene), book: clean(out && out.book) };
};
