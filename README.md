![Silky](./src/images/lightLogo.svg)

**A graph-native word processor for writers who plan stories non-linearly.**

Most writing tools are a stack of pages. Silky is a graph. The things in your story — characters, places, objects, secrets — are nodes. The prose is attached to the graph, not the other way around. You can write the ending first, discover what it needs, and work backwards.

Built for writers who crave dark themes. Shipped as a desktop app (Electron + React).

## The model

Silky stores a project as four kinds of *actors* and the edges between them:

| Actor | What it is | Edges |
|---|---|---|
| **Element** | A noun in the world — a character, a place, a thing. | |
| **Fact** | Something true in the world. | `INVOLVES` → Element · `DEPENDS_ON` → Element or Fact |
| **Snippet** | A unit of prose. | `APPEARS_IN` ← Element · `REVEALS` → Fact |
| **Thread** | An ordered sequence of snippets — a chapter, a POV, a timeline. | `STARTS_WITH` → Snippet |

Because facts depend on facts and snippets reveal facts, the graph can answer questions a page stack can't: *What does the reader know at this point? What has to be established before this scene can land? Which threads touch this character?*

The graph view is Cytoscape with a dozen layout engines; the editor is a rich-text workspace with element references inline.

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

```bash
npm i
npm run dev        # React dev server + Electron, concurrently
```

Build a packaged executable:

```bash
npm run build
npx electron-packager . --overwrite
```

Export to Neo4j (edit the bolt URL and credentials at the top of the script first):

```bash
node silkyToCypher.js
```

## Status

Silky is a working prototype and a personal tool, not a supported product. It is very much a work in progress — use caution when writing in it, keep backups, and expect rough edges.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
