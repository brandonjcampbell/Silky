/* The vocabulary of the model, in one place, so tooltips, empty states and
   the welcome screen all say the same thing. Scenes are stored as "snippet". */
export const KINDS = [
  { id: "element", label: "Elements", one: "element", glyph: "🧩", blurb: "The people, places and things of your story.", empty: "No people, places or things yet. Add one — or write a scene and let Spinner find them in it." },
  { id: "fact", label: "Facts", one: "fact", glyph: "💡", blurb: "Things that are true in the story. A scene reveals a fact; a fact involves elements; facts cause other facts.", empty: "No facts yet. A fact is anything true in the story — “Marley is dead”. Scenes reveal them; the Link scanner on a scene can suggest them." },
  { id: "snippet", label: "Scenes", one: "scene", glyph: "📜", blurb: "Where the writing happens. Each scene reveals facts and sits in one or more threads.", empty: "No scenes yet. A scene is a piece of the manuscript — write one here, or import a manuscript from the project tray." },
  { id: "thread", label: "Threads", one: "thread", glyph: "🧵", blurb: "An ordered run of scenes: the manuscript itself, a subplot, one character's arc.", empty: "No threads yet. A thread orders scenes — the whole manuscript, a subplot, one character's arc. Read it as one document." },
  { id: "web", label: "Webs", one: "web", glyph: "🕸️", blurb: "A graph of how it all connects: who's in what, what caused what.", empty: "No webs yet. A web draws the graph: pick a few elements or facts to capture and it expands along their links." },
];
export const kindOf = (id) => KINDS.find((k) => k.id === id);
