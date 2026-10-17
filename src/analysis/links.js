/* Find links a snippet could have but doesn't: facts it reveals, threads it
   belongs in, webs that should capture it, elements it mentions that have no
   facts yet. Deterministic; Spinner can refine the fact list (see llm/scan). */
import { plain, STOP } from "./text";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokens = (s) => (String(s).toLowerCase().match(/[a-zÀ-ɏ'’]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));

/** Elements whose name appears in the text, with mention counts. */
export const mentionedElements = (text, elements) => {
  const lower = text.toLowerCase();
  return elements
    .map((e) => {
      const name = String(e.name || "").trim();
      if (name.length < 2) return null;
      // whole-word match on the full name; also the last word for multi-word
      // names that read like "Harker" after a first full mention
      const full = (lower.match(new RegExp("(^|[^a-z\\u00C0-\\u024F])" + esc(name.toLowerCase()) + "(?![a-z\\u00C0-\\u024F])", "g")) || []).length;
      let n = full;
      const parts = name.split(/\s+/);
      if (full > 0 && parts.length > 1) {
        const last = parts[parts.length - 1].toLowerCase();
        if (last.length > 3 && !/^(the|of|and)$/.test(last)) {
          n += (lower.match(new RegExp("(^|[^a-z\\u00C0-\\u024F])" + esc(last) + "(?![a-z\\u00C0-\\u024F])", "g")) || []).length - full;
        }
      }
      return n > 0 ? { element: e, n } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.n - a.n);
};

/**
 * Facts that could be revealed by this scene: involve a mentioned element,
 * not already linked, scored by element coverage and keyword overlap.
 */
export const candidateFacts = (snippet, text, facts, mentioned, byFile) => {
  const mentionedSet = new Set(mentioned.map((m) => m.element.file));
  if (!mentionedSet.size) return [];
  const textTokens = new Set(tokens(text));
  const already = new Set(snippet.reveals || []);
  return facts
    .filter((f) => !already.has(f.file) && (f.involves || []).some((e) => mentionedSet.has(e)))
    .map((f) => {
      const inv = (f.involves || []).filter((e) => byFile.has(e));
      const covered = inv.filter((e) => mentionedSet.has(e)).length;
      const coverage = inv.length ? covered / inv.length : 0;
      const ft = tokens(f.name).filter((w) => !inv.some((e) => String((byFile.get(e) || {}).name || "").toLowerCase().includes(w)));
      const overlap = ft.length ? ft.filter((w) => textTokens.has(w)).length / ft.length : 0;
      const elsewhere = (f.revealed_by || []).length;
      // unrevealed facts are the ones most worth placing
      const score = coverage * 0.45 + overlap * 0.45 + (elsewhere === 0 ? 0.1 : 0);
      return { fact: f, score, coverage, overlap, elsewhere };
    })
    .filter((c) => c.coverage >= 0.5 && c.overlap >= 0.25)
    .sort((a, b) => b.score - a.score);
};

/** Threads whose cast overlaps this scene's, that don't yet include it. */
export const candidateThreads = (snippet, threads, mentioned, byFile) => {
  const mine = new Set(mentioned.slice(0, 15).map((m) => m.element.file));
  if (!mine.size) return [];
  return threads
    .filter((t) => t.name !== "Manuscript" && !t.sequences.includes(snippet.file) && t.sequences.length)
    .map((t) => {
      const cast = new Map();
      t.sequences.forEach((sf) => ((byFile.get(sf) || {}).reveals || []).forEach((ff) => ((byFile.get(ff) || {}).involves || []).forEach((e) => cast.set(e, (cast.get(e) || 0) + 1))));
      const top = [...cast.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([e]) => e);
      const shared = top.filter((e) => mine.has(e));
      return { thread: t, shared: shared.map((e) => byFile.get(e)).filter(Boolean), score: top.length ? shared.length / Math.min(top.length, mine.size) : 0 };
    })
    .filter((c) => c.shared.length >= 2 && c.score >= 0.3)
    .sort((a, b) => b.score - a.score);
};

/** Webs that capture most of this scene's cast but not the scene. */
export const candidateWebs = (snippet, webs, mentioned) => {
  const mine = mentioned.slice(0, 12).map((m) => m.element.file);
  if (!mine.length) return [];
  return webs
    .filter((w) => !(w.captures || []).some((c) => c.file === snippet.file))
    .map((w) => {
      const has = new Set((w.captures || []).map((c) => c.file));
      const shared = mine.filter((e) => has.has(e));
      return { web: w, shared: shared.length, score: shared.length / mine.length };
    })
    .filter((c) => c.shared >= 2 && c.score >= 0.4)
    .sort((a, b) => b.score - a.score);
};

/** Capitalised multi-word runs that aren't elements: possible new elements. */
export const unregisteredNames = (text, elements) => {
  const known = new Set(elements.map((e) => String(e.name).toLowerCase()));
  const knownWords = new Set(elements.flatMap((e) => String(e.name).toLowerCase().split(/\s+/)));
  const counts = new Map();
  const re = /(?:^|[.!?"“]\s+|\s)((?:[A-Z][a-zÀ-ɏ’']+)(?:\s+(?:of|the|de|van|von|du|la|le)?\s*[A-Z][a-zÀ-ɏ’']+){0,3})/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1].trim();
    const first = name.split(/\s+/)[0].toLowerCase();
    if (STOP.has(first) || /^(mr|mrs|dr|miss|sir|lady|lord|chapter|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|god|yes|no|oh|ah|well|then|but|when|what|how|why|where|who)$/i.test(first)) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([name, n]) => n >= 3 && !known.has(name.toLowerCase()) && !name.split(/\s+/).every((w) => knownWords.has(w.toLowerCase())))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, n]) => ({ name, n }));
};

/** The whole deterministic scan. */
export const scanSnippet = (snippet, actors) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const text = plain(snippet.content);
  const elements = actors.filter((a) => a.type === "element");
  const mentioned = mentionedElements(text, elements);
  return {
    text,
    mentioned,
    facts: candidateFacts(snippet, text, actors.filter((a) => a.type === "fact"), mentioned, byFile),
    threads: candidateThreads(snippet, actors.filter((a) => a.type === "thread"), mentioned, byFile),
    webs: candidateWebs(snippet, actors.filter((a) => a.type === "web"), mentioned),
    names: unregisteredNames(text, elements),
    byFile,
  };
};
