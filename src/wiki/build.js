/* Build a wiki from a project's actors: pure functions returning HTML
   strings, so the same pages render in the app and in the exported file. */
import { plain, wordCount } from "../analysis/text";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (file) => String(file).replace(/\.element\.json$/, "");

export const PAGE = {
  home: "home",
  elements: "elements",
  facts: "facts",
  threads: "threads",
  timeline: "timeline",
  scenes: "scenes",
};

/** Index the project once; every page draws from this. */
export const indexProject = (actors) => {
  const byFile = new Map(actors.map((a) => [a.file, a]));
  const snippets = actors.filter((a) => a.type === "snippet").sort((a, b) => a.order - b.order);
  const threads = actors.filter((a) => a.type === "thread");
  const manuscript = threads.find((t) => t.name === "Manuscript") || [...threads].sort((a, b) => b.sequences.length - a.sequences.length)[0];
  const order = new Map((manuscript ? manuscript.sequences : snippets.map((s) => s.file)).map((f, i) => [f, i]));
  const sceneOrder = (f) => (order.has(f) ? order.get(f) : 1e9);
  const scenesInOrder = [...snippets].sort((a, b) => sceneOrder(a.file) - sceneOrder(b.file));

  // element -> scenes it appears in (through the facts that involve it)
  const appearances = new Map();
  const related = new Map(); // element -> Map(other element -> count)
  actors.filter((a) => a.type === "fact").forEach((f) => {
    const els = (f.involves || []).filter((e) => byFile.has(e));
    els.forEach((e) => {
      if (!appearances.has(e)) appearances.set(e, new Set());
      (f.revealed_by || []).forEach((s) => appearances.get(e).add(s));
      if (!related.has(e)) related.set(e, new Map());
      els.forEach((o) => { if (o !== e) related.get(e).set(o, (related.get(e).get(o) || 0) + 1); });
    });
  });
  const threadsOf = (sceneFile) => threads.filter((t) => t.sequences.includes(sceneFile));

  return { actors, byFile, snippets, threads, manuscript, scenesInOrder, sceneOrder, appearances, related, threadsOf };
};

const excerpt = (html, n = 240) => {
  const t = plain(html).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
};

/* ── pages ─────────────────────────────────────────────────────────────── */

export const buildWiki = (actors, { link, projectName = "Project", articles = {} } = {}) => {
  const ix = indexProject(actors);
  const L = (id, text) => `<a href="${link(id)}">${text}</a>`;
  const el = (a) => L("e/" + slug(a.file), `${esc(a.icon)} ${esc(a.name)}`);
  const pages = {};
  const add = (id, title, body, kind) => { pages[id] = { id, title, kind, html: body }; };

  const elements = ix.actors.filter((a) => a.type === "element").sort((a, b) => a.name.localeCompare(b.name));
  const facts = ix.actors.filter((a) => a.type === "fact");
  const sceneList = (files) => `<ol class="wiki__scenes">${files.map((f) => { const s = ix.byFile.get(f); return s ? `<li>${L("s/" + slug(s.file), `${esc(s.icon)} ${esc(s.name)}`)}</li>` : ""; }).join("")}</ol>`;

  // home
  const top = [...elements].sort((a, b) => (b.involved_in || []).length - (a.involved_in || []).length).slice(0, 12);
  add(PAGE.home, projectName, `
    <p class="wiki__lede">${esc(projectName)} has ${elements.length} elements, ${facts.length} facts, ${ix.snippets.length} scenes and ${ix.threads.length} threads.</p>
    <h2>Principal elements</h2>
    <ul class="wiki__grid">${top.map((a) => `<li>${el(a)}<small>${(a.involved_in || []).length} facts</small></li>`).join("")}</ul>
    <h2>Browse</h2>
    <ul class="wiki__nav">
      <li>${L(PAGE.elements, "All elements A–Z")}</li>
      <li>${L(PAGE.threads, "Threads")}</li>
      <li>${L(PAGE.timeline, "Timeline")}</li>
      <li>${L(PAGE.scenes, "Scenes")}</li>
      <li>${L(PAGE.facts, "Every fact")}</li>
    </ul>`, "index");

  // elements A–Z
  const letters = new Map();
  elements.forEach((a) => { const k = (a.name[0] || "#").toUpperCase(); if (!letters.has(k)) letters.set(k, []); letters.get(k).push(a); });
  add(PAGE.elements, "Elements", [...letters.entries()].sort().map(([k, as]) => `<h2>${esc(k)}</h2><ul class="wiki__list">${as.map((a) => `<li>${el(a)}${a.content && a.content.trim() ? ` <span class="wiki__dim">— ${esc(excerpt(a.content, 100))}</span>` : ""}</li>`).join("")}</ul>`).join(""), "index");

  // each element
  elements.forEach((a) => {
    const apps = [...(ix.appearances.get(a.file) || [])].sort((x, y) => ix.sceneOrder(x) - ix.sceneOrder(y));
    const first = apps[0] && ix.byFile.get(apps[0]);
    const threadsSeen = new Map();
    apps.forEach((s) => ix.threadsOf(s).forEach((t) => threadsSeen.set(t.file, (threadsSeen.get(t.file) || 0) + 1)));
    const rel = [...(ix.related.get(a.file) || new Map()).entries()].sort((x, y) => y[1] - x[1]).slice(0, 12).map(([f, n]) => ({ a: ix.byFile.get(f), n })).filter((r) => r.a);
    const myFacts = (a.involved_in || []).map((f) => ix.byFile.get(f)).filter(Boolean).sort((x, y) => {
      const sx = Math.min(...(x.revealed_by || []).map(ix.sceneOrder), 1e9), sy = Math.min(...(y.revealed_by || []).map(ix.sceneOrder), 1e9);
      return sx - sy;
    });
    const article = articles[a.file];
    add("e/" + slug(a.file), a.name, `
      <aside class="wiki__infobox">
        <div class="wiki__infobox-icon">${esc(a.icon)}</div>
        <h3>${esc(a.name)}</h3>
        <dl>
          <dt>Facts</dt><dd>${myFacts.length}</dd>
          <dt>Appears in</dt><dd>${apps.length} scene${apps.length === 1 ? "" : "s"}</dd>
          ${first ? `<dt>First seen</dt><dd>${L("s/" + slug(first.file), esc(first.name))}</dd>` : ""}
          ${threadsSeen.size ? `<dt>Threads</dt><dd>${[...threadsSeen.entries()].sort((x, y) => y[1] - x[1]).map(([f]) => { const t = ix.byFile.get(f); return t ? L("t/" + slug(t.file), `${esc(t.icon)} ${esc(t.name)}`) : ""; }).join("<br>")}</dd>` : ""}
        </dl>
      </aside>
      ${a.content && a.content.trim() ? `<p class="wiki__lede">${esc(plain(a.content))}</p>` : ""}
      ${article ? `<div class="wiki__article">${article.html}</div>` : ""}
      ${myFacts.length ? `<h2>What is known</h2><ul class="wiki__facts">${myFacts.map((f) => `<li>${esc(f.name)}${(f.revealed_by || []).length ? ` <span class="wiki__cite">${(f.revealed_by || []).map((s) => { const sn = ix.byFile.get(s); return sn ? L("s/" + slug(sn.file), `[${ix.sceneOrder(s) < 1e9 ? ix.sceneOrder(s) + 1 : "·"}]`) : ""; }).join("")}</span>` : ""}${(f.because || []).length ? `<div class="wiki__because">because: ${(f.because || []).map((b) => esc((ix.byFile.get(b) || {}).name || "")).filter(Boolean).join("; ")}</div>` : ""}</li>`).join("")}</ul>` : ""}
      ${rel.length ? `<h2>Connected to</h2><ul class="wiki__grid">${rel.map((r) => `<li>${el(r.a)}<small>${r.n} shared fact${r.n === 1 ? "" : "s"}</small></li>`).join("")}</ul>` : ""}
      ${apps.length ? `<h2>Appearances</h2>${sceneList(apps)}` : ""}`, "element");
  });

  // threads
  add(PAGE.threads, "Threads", `<ul class="wiki__list">${ix.threads.map((t) => `<li>${L("t/" + slug(t.file), `${esc(t.icon)} ${esc(t.name)}`)} <span class="wiki__dim">— ${t.sequences.length} scenes</span></li>`).join("")}</ul>`, "index");
  ix.threads.forEach((t) => {
    const scenes = t.sequences.map((f) => ix.byFile.get(f)).filter(Boolean);
    const words = scenes.reduce((n, s) => n + wordCount(plain(s.content)), 0);
    const cast = new Map();
    scenes.forEach((s) => (s.reveals || []).forEach((f) => ((ix.byFile.get(f) || {}).involves || []).forEach((e) => cast.set(e, (cast.get(e) || 0) + 1))));
    const castTop = [...cast.entries()].sort((x, y) => y[1] - x[1]).slice(0, 10).map(([f]) => ix.byFile.get(f)).filter(Boolean);
    add("t/" + slug(t.file), t.name, `
      <aside class="wiki__infobox"><div class="wiki__infobox-icon">${esc(t.icon)}</div><h3>${esc(t.name)}</h3><dl><dt>Scenes</dt><dd>${scenes.length}</dd><dt>Words</dt><dd>${words.toLocaleString()}</dd></dl></aside>
      ${t.content && t.content.trim() ? `<p class="wiki__lede">${esc(plain(t.content))}</p>` : ""}
      ${castTop.length ? `<h2>Cast</h2><ul class="wiki__grid">${castTop.map((a) => `<li>${el(a)}</li>`).join("")}</ul>` : ""}
      <h2>Scenes</h2>
      <ol class="wiki__synopsis">${scenes.map((s) => `<li><b>${L("s/" + slug(s.file), esc(s.name))}</b><p>${esc(excerpt(s.content))}</p></li>`).join("")}</ol>`, "thread");
  });

  // timeline + scenes
  add(PAGE.timeline, "Timeline", `<p class="wiki__lede">The scenes in ${ix.manuscript ? `the order of “${esc(ix.manuscript.name)}”` : "list order"}.</p><ol class="wiki__timeline">${ix.scenesInOrder.map((s) => `<li><b>${L("s/" + slug(s.file), esc(s.name))}</b><span class="wiki__dim">${(s.reveals || []).length} facts</span><p>${esc(excerpt(s.content, 160))}</p></li>`).join("")}</ol>`, "index");
  add(PAGE.scenes, "Scenes", `<ul class="wiki__list">${ix.scenesInOrder.map((s) => `<li>${L("s/" + slug(s.file), `${esc(s.icon)} ${esc(s.name)}`)} <span class="wiki__dim">— ${wordCount(plain(s.content)).toLocaleString()} words</span></li>`).join("")}</ul>`, "index");
  ix.scenesInOrder.forEach((s, i) => {
    const prev = ix.scenesInOrder[i - 1], next = ix.scenesInOrder[i + 1];
    const reveals = (s.reveals || []).map((f) => ix.byFile.get(f)).filter(Boolean);
    const present = new Map();
    reveals.forEach((f) => (f.involves || []).forEach((e) => present.set(e, (present.get(e) || 0) + 1)));
    const cast = [...present.entries()].sort((x, y) => y[1] - x[1]).map(([f]) => ix.byFile.get(f)).filter(Boolean);
    add("s/" + slug(s.file), s.name, `
      <aside class="wiki__infobox"><div class="wiki__infobox-icon">${esc(s.icon)}</div><h3>${esc(s.name)}</h3><dl><dt>Position</dt><dd>${i + 1} of ${ix.scenesInOrder.length}</dd><dt>Words</dt><dd>${wordCount(plain(s.content)).toLocaleString()}</dd>${ix.threadsOf(s.file).length ? `<dt>Threads</dt><dd>${ix.threadsOf(s.file).map((t) => L("t/" + slug(t.file), `${esc(t.icon)} ${esc(t.name)}`)).join("<br>")}</dd>` : ""}</dl></aside>
      <p class="wiki__lede">${esc(excerpt(s.content, 600))}</p>
      ${cast.length ? `<h2>Present</h2><ul class="wiki__grid">${cast.map((a) => `<li>${el(a)}</li>`).join("")}</ul>` : ""}
      ${reveals.length ? `<h2>Established here</h2><ul class="wiki__facts">${reveals.map((f) => `<li>${esc(f.name)}</li>`).join("")}</ul>` : ""}
      <p class="wiki__prevnext">${prev ? L("s/" + slug(prev.file), "← " + esc(prev.name)) : "<span></span>"}${next ? L("s/" + slug(next.file), esc(next.name) + " →") : ""}</p>`, "scene");
  });

  // facts
  add(PAGE.facts, "Facts", `<ol class="wiki__facts wiki__facts--all">${[...facts].sort((x, y) => Math.min(...(x.revealed_by || []).map(ix.sceneOrder), 1e9) - Math.min(...(y.revealed_by || []).map(ix.sceneOrder), 1e9)).map((f) => `<li>${esc(f.name)} <span class="wiki__dim">${(f.involves || []).map((e) => ix.byFile.get(e)).filter(Boolean).map((a) => el(a)).join(", ")}</span></li>`).join("")}</ol>`, "index");

  return { pages, index: ix };
};

/* ── static export ─────────────────────────────────────────────────────── */

export const WIKI_CSS = `
:root{--bg:#1e1d1e;--side:#1b1818;--raised:#333030;--line:rgba(255,255,255,.1);--ink:#f2f0f2;--soft:#b8b3b8;--muted:#7c777c;--accent:#fe004c;--accentSoft:rgba(254,0,76,.18)}
.wiki{color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wiki a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}.wiki a:hover{color:var(--accent);border-color:var(--accent)}
.wiki h1{font-size:26px;margin:0 0 12px;font-weight:600}.wiki h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--soft);margin:26px 0 8px;font-weight:600}.wiki h3{margin:6px 0 10px;font-size:17px}
.wiki__lede{font-size:16px;color:var(--soft);margin:0 0 10px}
.wiki__infobox{float:right;width:240px;margin:0 0 16px 24px;padding:14px;background:var(--raised);border:1px solid var(--line);border-radius:4px;font-size:13px}
.wiki__infobox-icon{font-size:40px;line-height:1}
.wiki__infobox dl{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:0}.wiki__infobox dt{color:var(--muted)}.wiki__infobox dd{margin:0}
.wiki__grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px}
.wiki__grid li{background:var(--raised);border:1px solid var(--line);border-radius:4px;padding:8px 10px;display:flex;flex-direction:column;gap:2px}.wiki__grid li a{border:0}.wiki__grid small{color:var(--muted);font-size:11px}
.wiki__list{margin:0;padding-left:0;list-style:none;columns:2;column-gap:28px}.wiki__list li{break-inside:avoid;padding:3px 0}
.wiki__facts{margin:0;padding-left:20px}.wiki__facts li{margin:4px 0;color:var(--soft)}
.wiki__cite a{border:0;color:var(--muted);font-size:11px;margin-left:3px;vertical-align:super}
.wiki__because{font-size:12px;color:var(--muted);margin-left:2px}
.wiki__scenes,.wiki__timeline,.wiki__synopsis{margin:0;padding-left:22px}.wiki__scenes li{padding:2px 0}
.wiki__timeline li,.wiki__synopsis li{margin:0 0 12px}.wiki__timeline p,.wiki__synopsis p{margin:2px 0 0;color:var(--soft);font-size:14px}.wiki__timeline .wiki__dim{margin-left:8px}
.wiki__dim{color:var(--muted);font-size:13px}.wiki__dim a{border:0}
.wiki__nav{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}.wiki__nav li a{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:999px}
.wiki__prevnext{display:flex;justify-content:space-between;margin-top:28px;padding-top:12px;border-top:1px solid var(--line)}
.wiki__article p{margin:0 0 10px}
.wiki__facts--all li{color:var(--ink)}
.wiki::after{content:"";display:block;clear:both}
@media(max-width:700px){.wiki__infobox{float:none;width:auto;margin:0 0 14px}.wiki__list{columns:1}}
`;

/** One self-contained HTML file with every page and a tiny hash router. */
export const exportWikiHtml = (actors, projectName, articles = {}) => {
  const { pages } = buildWiki(actors, { link: (id) => "#" + id, projectName, articles });
  const data = JSON.stringify(pages).replace(/<\//g, "<\\/");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(projectName)} — wiki</title>
<style>
html,body{margin:0;background:var(--bg)}
${WIKI_CSS}
.shell{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
.side{background:var(--side);border-right:1px solid var(--line);padding:18px 16px;position:sticky;top:0;height:100vh;box-sizing:border-box;overflow:auto}
.side h1{font-size:16px;margin:0 0 14px}.side a{display:block;padding:5px 0;border:0;color:var(--soft)}.side a.on{color:var(--accent)}
.side input{width:100%;box-sizing:border-box;font:inherit;font-size:13px;color:var(--ink);background:var(--raised);border:1px solid var(--line);border-radius:4px;padding:6px 8px;margin:8px 0}
.side .hits a{font-size:13px}
main{padding:28px 36px 60px;max-width:960px}
.crumb{font-size:12px;color:var(--muted);margin-bottom:8px}.crumb a{border:0;color:var(--muted)}
@media(max-width:800px){.shell{grid-template-columns:1fr}.side{position:static;height:auto}}
</style></head>
<body><div class="shell"><nav class="side"><h1>${esc(projectName)}</h1>
<a href="#home">Overview</a><a href="#elements">Elements</a><a href="#threads">Threads</a><a href="#timeline">Timeline</a><a href="#scenes">Scenes</a><a href="#facts">Facts</a>
<input id="q" type="search" placeholder="Search pages"><div class="hits" id="hits"></div></nav>
<main class="wiki" id="main"></main></div>
<script>
var PAGES=${data};
function render(){var id=decodeURIComponent(location.hash.slice(1))||"home";var p=PAGES[id]||PAGES.home;document.getElementById("main").innerHTML='<div class="crumb"><a href="#home">${esc(projectName)}</a> › '+(p.kind||"")+'</div><h1>'+p.title.replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})+'</h1>'+p.html;document.title=p.title+" — ${esc(projectName)}";window.scrollTo(0,0);
  var links=document.querySelectorAll(".side > a");for(var i=0;i<links.length;i++){links[i].className=links[i].getAttribute("href")==="#"+id?"on":""}}
window.addEventListener("hashchange",render);render();
var q=document.getElementById("q"),hits=document.getElementById("hits");
q.addEventListener("input",function(){var s=q.value.trim().toLowerCase();if(!s){hits.innerHTML="";return}var out=[];for(var k in PAGES){if(PAGES[k].kind!=="index"&&PAGES[k].title.toLowerCase().indexOf(s)>=0)out.push(PAGES[k]);if(out.length>=20)break}hits.innerHTML=out.map(function(p){return '<a href="#'+encodeURIComponent(p.id)+'">'+p.title.replace(/</g,"&lt;")+'</a>'}).join("")});
</script></body></html>`;
};
