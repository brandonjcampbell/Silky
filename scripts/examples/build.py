"""Build an example project file from a compact spec (see hound.py, carol.py).

Spec shape:
  TITLE, BLURB, NOTE
  ELEMENTS = [(name, icon, description), ...]
  SCENES   = [(title, synopsis_paragraphs:list[str]), ...]      # in manuscript order
  FACTS    = [(statement, [element names], [scene indexes 0-based], [cause statements]), ...]
  THREADS  = [(name, icon, description, [scene indexes]), ...]
"""
import json, math, re, sys, html

def build(spec, out_path):
    stamp = spec.STAMP
    actors = []
    seq = [0]
    def mk(t, name, icon, extra):
        uuid = f"{t}-{stamp}-{seq[0]:x}"; seq[0] += 1
        a = {"name": name, "file": uuid + ".element.json", "type": t, "icon": icon, "order": len(actors), "uuid": uuid, "captured_in": [], **extra}
        actors.append(a); return a

    def para_html(paras):
        return "".join(f"<p>{html.escape(p)}</p>" for p in paras)

    # snippets
    note = f"<p><em>{html.escape(spec.NOTE)}</em></p>"
    snippets = [mk("snippet", title, "📜", {"content": note + para_html(paras), "reveals": [], "sequenced_in": []}) for title, paras in spec.SCENES]

    # elements
    el_by_name = {}
    for name, icon, desc in spec.ELEMENTS:
        e = mk("element", name, icon, {"content": f"<p>{html.escape(desc)}</p>", "involved_in": [], "origin": "assistant"})
        el_by_name[name.lower()] = e

    # facts
    fact_by_stmt = {}
    for stmt, names, scenes, _ in spec.FACTS:
        f = mk("fact", stmt, "💡", {"content": [], "causes": [], "because": [], "involves": [], "revealed_by": [], "origin": "assistant"})
        for n in names:
            e = el_by_name.get(n.lower())
            if not e: raise SystemExit(f"unknown element {n!r} in fact {stmt!r}")
            f["involves"].append(e["file"]); e["involved_in"].append(f["file"])
        for si in scenes:
            s = snippets[si]; f["revealed_by"].append(s["file"]); s["reveals"].append(f["file"])
        fact_by_stmt[stmt] = f
    for stmt, _, _, causes in spec.FACTS:
        f = fact_by_stmt[stmt]
        for c in causes:
            cf = fact_by_stmt.get(c)
            if not cf: raise SystemExit(f"unknown cause {c!r}")
            f["because"].append(cf["file"]); cf["causes"].append(f["file"])

    # threads
    manu = mk("thread", "Manuscript", "🧵", {"content": "", "sequences": [s["file"] for s in snippets]})
    for s in snippets: s["sequenced_in"].append(manu["file"])
    threads = []
    for name, icon, desc, idx in spec.THREADS:
        t = mk("thread", name, icon, {"content": f"<p>{html.escape(desc)}</p>", "sequences": [snippets[i]["file"] for i in idx], "origin": "assistant"})
        for i in idx: snippets[i]["sequenced_in"].append(t["file"])
        threads.append(t)

    by_file = {a["file"]: a for a in actors}
    def ring(web, members):
        for t, rx, ry in [("element", 520, 330), ("fact", 340, 215), ("snippet", 170, 100), ("thread", 60, 30)]:
            items = [a for a in members if a["type"] == t]
            for i, a in enumerate(items):
                ang = 2 * math.pi * i / max(len(items), 1)
                web["captures"].append({"file": a["file"], "x": round(600 + rx * math.cos(ang)), "y": round(420 + ry * math.sin(ang))}); a["captured_in"].append(web["file"])
    def web(title, members, expands):
        w = mk("web", title, "🕸️", {"captures": [], "expands": expands, "origin": "assistant"}); ring(w, members); return w

    for t in threads:
        scenes = [by_file[f] for f in t["sequences"]]
        facts = {f: by_file[f] for s in scenes for f in s["reveals"]}
        cnt = {}
        for fa in facts.values():
            for e in fa["involves"]: cnt[e] = cnt.get(e, 0) + 1
        mn = 2 if len(facts) > 60 else 1
        els = [by_file[e] for e, c in cnt.items() if c >= mn]
        web(f"{t['name']} — web", [t, *scenes, *facts.values(), *els], ["reveals", "because", "involves", "then"])
    els = [a for a in actors if a["type"] == "element"]
    top = sorted(els, key=lambda a: -len(a["involved_in"]))[:12]; ts = {a["file"] for a in top}
    ties = [a for a in actors if a["type"] == "fact" and len([f for f in a["involves"] if f in ts]) >= 2]
    web("Principal cast — web", [*top, *ties], ["involves", "because"])
    everything = [a for a in actors if a["type"] != "web"]
    if len(everything) <= 300:
        web(f"{spec.TITLE} — whole web", everything, ["reveals", "because", "involves", "then"])

    files = {a["file"]: json.dumps(a, ensure_ascii=False) for a in actors}
    json.dump({"silky": 1, "project": spec.TITLE, "blurb": spec.BLURB, "files": files}, open(out_path, "w"), ensure_ascii=False)
    kinds = {}
    for a in actors: kinds[a["type"]] = kinds.get(a["type"], 0) + 1
    links = sum(len(a["because"]) for a in actors if a["type"] == "fact")
    print(spec.TITLE, kinds, "causal links:", links)

if __name__ == "__main__":
    import importlib
    mod = importlib.import_module(sys.argv[1])
    build(mod, sys.argv[2])
