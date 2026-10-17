![Silky](./src/images/lightLogo.svg)

**A graph-native word processor for writers who plan stories non-linearly. Runs in your browser — nothing to install.**

**→ https://brandonjcampbell.github.io/Silky/**

Most writing tools are a stack of pages. Silky is a graph. The things in your story — characters, places, objects, secrets — are nodes. The prose is attached to the graph, not the other way around. You can write the ending first, discover what it needs, and work backwards.

Built for writers who crave dark themes. Your projects stay in your browser (or in a folder you choose); nothing is uploaded anywhere.

![A Silky web: elements, facts, snippets and threads laid out as a graph, with involves / because / reveals edges between them](docs/silky-web.png)

## The model

Silky stores a project as four kinds of *actors* and the edges between them:

| Actor | What it is | Edges |
|---|---|---|
| **Element** | A noun in the world — a character, a place, a thing. | |
| **Fact** | Something true in the world. | `INVOLVES` → Element · `DEPENDS_ON` → Element or Fact |
| **Snippet** | A unit of prose. | `APPEARS_IN` ← Element · `REVEALS` → Fact |
| **Thread** | An ordered sequence of snippets — a chapter, a POV, a timeline. | `STARTS_WITH` → Snippet |

Because facts depend on facts and snippets reveal facts, the graph can answer questions a page stack can't: *What does the reader know at this point? What has to be established before this scene can land? Which threads touch this character?*

The graph view is Cytoscape; the editor is a proper writing surface — headings, quotes, lists, scene breaks, keyboard shortcuts — that autosaves as you type.

![Writing a snippet: formatting toolbar, the scene in a serif, word count and save state](docs/silky-snippet.png)

*A snippet. The scene is on top; below it, the facts this scene reveals and the thread it belongs to. Every list is an edge in the graph.*

![A thread: its scenes read as one continuous manuscript, with the sequence list and thread notes in a side panel](docs/silky-thread.png)

*A thread. Its scenes read as one manuscript — edit any of them in place and it saves to its own snippet. Drag the list in the panel to reorder; the manuscript follows. A **web** (the hero image above) captures any set of actors and draws the edges between them — `involves`, `because`, `reveals`, and `then` along threads.*

## Read aloud

The speaker button in a scene's or thread's header reads it with the browser's own voices — no network, no key. It starts from the cursor if the cursor is in the text, speaks a sentence at a time with a player showing the current sentence and position, and offers previous/next, a scrub bar, voice and speed. A thread reads its scenes in order.

## Change tracking and impact

Every save that changes an actor's name or text leaves a version (saves within two minutes collapse into one, forty are kept per actor). The **History** panel under any actor lists them with word deltas, shows a word-level diff against the version before, and restores. The **Impact** panel shows what depends on the actor — for a fact, the scenes that state it and the facts that follow from it (and the scenes stating those); for an element, its facts, the scenes where they are stated, its threads, and every mention in the prose; for a scene, the facts stated here, the later facts and scenes that rest on them, and its threads — and flags what to re-check: scenes last edited before a fact they state changed, reader notes and wiki entries written before the last edit. Rename an element and Impact offers to carry the new name into every scene and fact that used the old one.

## Ideas, and knowing what the model wrote

Under a snippet's editor, **Ask Spinner for ideas** offers prompts — what happens next, continue the scene, a line of dialogue, describe the setting, a complication, deepen a character, questions a reader would ask, or anything you type — and returns three suggestions in the manuscript's voice, built only from the scene and the project's facts. **Insert** drops one at the cursor, wrapped as Spinner's and logged. **Show AI text** underlines every such passage in the editor. The **AI influence** analysis reports how many words in each scene still trace to Spinner (including passages you have since rewritten, with how much of the original wording survives), lists every insertion with when and why it was asked for, and can un-mark (keep the words) or remove (delete them) one insertion, one scene, or everything. Facts, elements and threads that Spinner created through import or scans carry an `origin` and are listed there too.

## Scanning a scene for links

Under a snippet's editor, **Scan for links** reads the scene's text and proposes what it should be connected to: the elements it mentions; facts involving them that the scene plausibly reveals (scored by how many of the fact's elements appear and how much of its wording does, with unplaced facts flagged); threads whose cast overlaps the scene's; webs that capture most of its cast; and capitalised names that aren't elements yet. Each suggestion has an Add or Create button; **Ask Spinner** has the model read the scene to confirm which candidate facts it truly establishes and to list new facts and elements the project doesn't have.

## Analyses

The analyses glyph on the sidebar's activity bar opens four analyses, each measured over any thread (the whole manuscript by default): **Word count** (totals, every scene and thread), **Pacing** (scene lengths, dialogue share and sentence rhythm charted in order, with outliers), **Style** (sentence length and variance, dialogue, reading grade, vocabulary, -ly adverbs, passive hints, filter words, most-used words, the longest sentence), and **Reader** — with a model connected, it plays a reader of your choosing (a first-time reader, an impatient commuter, a genre devotee, a literary critic, an acquiring editor, a teen, a continuity nitpicker, someone reading aloud, or any you describe yourself — and every profile, preset or not, can be edited per project: who they are, what they read, what they care about, what loses them, how patient they are and how hard they score) reading each scene cold with a running memory of what came before, giving engagement and clarity scores, a reaction, open questions and a line it will remember, then a letter about the whole. Run several readers and compare them scene by scene — where they agree, where they split, and what each would say about the book. Notes are saved in the project.

## Wiki

The wiki glyph on the activity bar turns the project into an encyclopedia: a page for every element (infobox, what is known about it with scene citations, what it is connected to, where it appears), every thread (cast and a scene-by-scene synopsis), every scene (who is present, what is established, previous/next), plus A–Z, timeline and fact indexes, all cross-linked. **Download wiki** writes it as one self-contained, searchable HTML file. With a model connected, **Write entries** drafts an encyclopedia article for each element with three or more facts — from those facts alone, so the wiki never knows more than the book does.

## Examples

The project tray lists example projects bundled with the site; **Dracula** is Bram Stoker's novel run through the manuscript import below (113 scenes, 180 elements, 1,143 facts, and seven plot threads from Jonathan at the castle to the chase back to Transylvania). Click one to copy it into your own projects. To add an example, drop a project export (the file the download icon on a project card produces) into `public/examples/` — the index is rebuilt on every start and build.

## Importing a manuscript

If you already have a draft, Silky can build the model from it. The model is called **Spinner**; the spinning-wheel glyph at the foot of the activity bar (or the **Spinner** button on the project tray) connects it. The no-setup option is **In this browser**: a small open model (Qwen2.5 3B by default; 1.5B to 7B offered) runs on your own GPU through WebGPU, downloads once and then works offline with nothing leaving your machine — good for reader notes and wiki entries, rough for manuscript import, Chrome or Edge required. Otherwise point it at any OpenAI-compatible endpoint (OpenAI, OpenRouter, a local Ollama, LM Studio or vLLM) or Anthropic; the key stays in your browser's localStorage and is sent only to the address you enter.

**Import manuscript** then takes pasted text or a `.txt`/`.md` file, splits it into scenes at headings and scene breaks (`* * *`, `---`, "Chapter …"), and shows the split before anything is sent. With a model connected, each scene is read once with a running cast list; the model returns the elements it introduces and the facts it establishes, then two passes over the whole: one links causes to effects, one traces the separate plot threads — a character's arc, a subplot, a journey — and which scenes each runs through. The result is a new project: a snippet per scene, elements, facts wired by `involves`, `revealed_by` and `because`, a **Manuscript** thread running every scene in order, one thread per plot line the model found, a web for each of those threads, a web of the principal cast, and a web of the whole thing when it is small enough to read. Any web can be re-laid out from the toolbar on the graph (force, concentric, tree, circle, grid) and the result saved. Without a model, the same import still gives you the scenes and thread.

Everything it produces is a draft meant to be pruned.

## Neo4j

Projects live on disk as JSON, so the app runs with no database. `silkyToCypher.js` exports a project into Neo4j as `Element`, `Fact`, `Snippet`, and `Thread` nodes with the edges above, so you can run Cypher over your own narrative:

```cypher
// Every fact a character's scenes reveal, and what those facts depend on
MATCH (e:Element {name: "Mara"})-[:APPEARS_IN]->(s:Snippet)-[:REVEALS]->(f:Fact)
OPTIONAL MATCH (f)-[:DEPENDS_ON]->(d)
RETURN s.name, f.name, collect(d.name) AS prerequisites
```

I demoed this at GraphConnect 2022 (*Weaving Tangled Webs: Using Graphs to Author Content*).

## Running it

**Just open it:** https://brandonjcampbell.github.io/Silky/

Projects are saved in your browser (IndexedDB). In Chrome or Edge, **Connect a folder** from the bar at the top to also mirror every project to a real directory on disk as plain JSON files; anywhere else, the download icon on a project card exports that project as JSON, **Export all** on the top bar exports every project at once, and **Import…** reads either kind of file. Nothing leaves your machine either way.

**Run it locally:**

```bash
npm i
npm start          # http://localhost:3000
```

**Export a project to Neo4j** (edit the bolt URL and credentials at the top of the script first):

```bash
node silkyToCypher.js
```

### Desktop app (optional)

Silky began as an Electron app and still builds as one. Projects then live in `~/.silky/<project>/` as the same JSON files.

```bash
npm run electron   # React dev server + Electron, concurrently
npm run build && npx electron-packager . --overwrite   # packaged executable
```

## How storage works

All file I/O goes through `src/storage/`, which picks a backend at startup. In the browser that is an in-memory mirror of a virtual filesystem, hydrated from IndexedDB before React mounts and written through after every change, with optional one-way sync to a real folder via the File System Access API. Under Electron it is Node `fs`. The components call the same synchronous `loadDir` / `loadFile` / `saveFile` utilities either way, so the two builds share every line above the storage layer.

The compiled app is also published to the [`build`](https://github.com/brandonjcampbell/Silky/tree/build) branch on every push, so `git clone -b build` and opening `index.html` works with no npm at all.

## Status

Silky is a working prototype and a personal tool, not a supported product. It is very much a work in progress — use caution when writing in it, keep backups (Export is one click), and expect rough edges.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
