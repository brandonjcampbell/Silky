/* Impact of a change: what depends on an actor, and what may have gone
   stale since it last changed. Pure; takes the project's actors. */
import { plain } from "./analysis/text";
import { loadReader } from "./analysis/reader";
import { loadArticles } from "./wiki/articles";

const uniq = (xs) => [...new Set(xs)];

/** Facts downstream of a fact through `causes`, to a depth, with the path length. */
export const downstream = (fact, byFile, depth = 3) => {
  const out = new Map();
  let frontier = [fact.file];
  for (let d = 1; d <= depth && frontier.length; d += 1) {
    const next = [];
    frontier.forEach((f) => ((byFile.get(f) || {}).causes || []).forEach((c) => {
      if (c !== fact.file && !out.has(c) && byFile.has(c)) { out.set(c, d); next.push(c); }
    }));
    frontier = next;
  }
  return [...out.entries()].map(([f, d]) => ({ actor: byFile.get(f), depth: d }));
};

/** Scenes in manuscript order that reveal any of the given facts. */
const scenesRevealing = (facts, byFile, order) =>
  uniq(facts.flatMap((f) => f.revealed_by || [])).map((s) => byFile.get(s)).filter(Boolean).sort((a, b) => order(a.file) - order(b.file));

/** Element name mentions in scene text (for rename propagation). */
export const mentions = (name, snippets) => {
  const n = String(name || "").trim();
  if (n.length < 2) return [];
  const re = new RegExp("(^|[^A-Za-z\\u00C0-\\u024F])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z\\u00C0-\\u024F])", "g");
  return snippets.map((s) => ({ scene: s, n: (plain(s.content).match(re) || []).length })).filter((x) => x.n > 0);
};

/**
 * The impact of (changing) `actor`.
 * Returns sections the UI renders: { scenes, facts, elements, threads, webs, stale, derived }
 */
export const impactOf = (actor, actors, dir) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const threads = actors.filter((a) => a.type === "thread");
  const manuscript = threads.find((t) => t.name === "Manuscript") || [...threads].sort((a, b) => b.sequences.length - a.sequences.length)[0];
  const orderMap = new Map((manuscript ? manuscript.sequences : []).map((f, i) => [f, i]));
  const order = (f) => (orderMap.has(f) ? orderMap.get(f) : 1e9);
  const snippets = actors.filter((a) => a.type === "snippet");
  const updated = actor.updated || 0;
  const stale = [];
  const r = { scenes: [], facts: [], elements: [], threads: [], webs: [], stale, derived: [], renames: [] };

  const webs = actors.filter((a) => a.type === "web" && (a.captures || []).some((c) => c.file === actor.file));
  r.webs = webs;

  if (actor.type === "fact") {
    const direct = (actor.revealed_by || []).map((s) => byFile.get(s)).filter(Boolean).sort((a, b) => order(a.file) - order(b.file));
    r.scenes = direct.map((s) => ({ actor: s, how: "states this" }));
    const down = downstream(actor, byFile);
    r.facts = down.map((d) => ({ actor: d.actor, how: d.depth === 1 ? "follows from it" : `follows at ${d.depth} removes` }));
    const later = scenesRevealing(down.map((d) => d.actor), byFile, order).filter((s) => !direct.includes(s));
    later.forEach((s) => r.scenes.push({ actor: s, how: "states a consequence" }));
    r.elements = (actor.involves || []).map((e) => byFile.get(e)).filter(Boolean).map((e) => ({ actor: e, how: "involved" }));
    direct.forEach((s) => { if (updated && (s.updated || 0) < updated) stale.push({ actor: s, why: "last edited before this fact changed — check it still says this" }); });
  }

  if (actor.type === "element") {
    const facts = (actor.involved_in || []).map((f) => byFile.get(f)).filter(Boolean);
    r.facts = facts.map((f) => ({ actor: f, how: "involves it" }));
    const scenes = scenesRevealing(facts, byFile, order);
    r.scenes = scenes.map((s) => ({ actor: s, how: "where its facts are stated" }));
    const tset = new Map();
    scenes.forEach((s) => threads.filter((t) => t.sequences.includes(s.file)).forEach((t) => tset.set(t.file, (tset.get(t.file) || 0) + 1)));
    r.threads = [...tset.entries()].map(([f, n]) => ({ actor: byFile.get(f), how: `${n} scene${n === 1 ? "" : "s"}` }));
    r.renames = mentions(actor.name, snippets);
  }

  if (actor.type === "snippet") {
    const reveals = (actor.reveals || []).map((f) => byFile.get(f)).filter(Boolean);
    r.facts = reveals.map((f) => ({ actor: f, how: "stated here" }));
    // consequences revealed in later scenes rest on this scene's facts
    const consequences = uniq(reveals.flatMap((f) => downstream(f, byFile, 2).map((d) => d.actor.file))).map((f) => byFile.get(f)).filter(Boolean);
    consequences.forEach((f) => r.facts.push({ actor: f, how: "rests on something stated here" }));
    const later = scenesRevealing(consequences, byFile, order).filter((s) => s.file !== actor.file && order(s.file) > order(actor.file));
    r.scenes = later.map((s) => ({ actor: s, how: "depends on this scene" }));
    r.threads = threads.filter((t) => t.sequences.includes(actor.file)).map((t) => ({ actor: t, how: `position ${t.sequences.indexOf(actor.file) + 1} of ${t.sequences.length}` }));
    const cast = new Map();
    reveals.forEach((f) => (f.involves || []).forEach((e) => cast.set(e, (cast.get(e) || 0) + 1)));
    r.elements = [...cast.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => ({ actor: byFile.get(f), how: `${n} fact${n === 1 ? "" : "s"} here` })).filter((x) => x.actor);
    // derived material that predates the last edit
    if (dir) {
      const rd = loadReader(dir);
      Object.entries(rd.readers || {}).forEach(([rid, d]) => {
        const note = d.scenes && d.scenes[actor.file];
        if (note && updated && note.at < updated) r.derived.push({ what: "reader note", who: rid, at: note.at });
      });
      reveals.forEach((f) => { if (updated && (f.updated || 0) < updated && f.updated) stale.push({ actor: f, why: "stated here, but this scene changed after the fact was last touched — still true?" }); });
    }
  }

  if (actor.type === "thread") {
    r.scenes = (actor.sequences || []).map((s) => byFile.get(s)).filter(Boolean).map((s, i) => ({ actor: s, how: `scene ${i + 1}` }));
  }

  if (dir && actor.type === "element") {
    const art = loadArticles(dir).articles[actor.file];
    if (art && updated && art.at < updated) r.derived.push({ what: "wiki entry", at: art.at });
    const facts = (actor.involved_in || []).map((f) => byFile.get(f)).filter(Boolean);
    const newest = Math.max(0, ...facts.map((f) => f.updated || 0));
    if (art && newest > art.at) r.derived.push({ what: "wiki entry", at: art.at, why: "facts about it changed since" });
  }

  r.total = r.scenes.length + r.facts.length + r.elements.length + r.threads.length + r.webs.length;
  return r;
};
